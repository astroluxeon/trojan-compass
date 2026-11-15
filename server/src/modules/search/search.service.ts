import type { PlaceSearchResult } from '@trojan-compass/shared';
import type {
  DatasetPort,
  PlaceSearchInput,
  RequestScope,
  SearchPort,
} from '../../ports/service-ports.js';
import { page } from './pagination.js';
export const normalize = (s: string) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
function rank(query: string, labels: string[]) {
  const q = normalize(query);
  if (!q) return 3;
  const all = labels.map(normalize);
  return all.some((s) => s === q)
    ? 0
    : all.some((s) => s.startsWith(q))
      ? 1
      : all.some((s) => s.includes(q))
        ? 2
        : Infinity;
}
export class SearchService implements SearchPort {
  constructor(private datasets: DatasetPort) {}
  async searchBuildings(
    scope: RequestScope,
    input: { query: string; limit: number; cursor?: string }
  ) {
    const matches = (await this.datasets.listBuildings(scope))
      .map((b) => ({ b, score: rank(input.query, [b.code, b.name, ...b.aliases]) }))
      .filter((x) => Number.isFinite(x.score))
      .sort((a, b) => a.score - b.score || a.b.id.localeCompare(b.b.id));
    const result = page(
      matches.map((x) => x.b),
      input.limit,
      input.cursor,
      [scope.dataVersion, 'buildings', input.query, input.limit]
    );
    return { buildings: result.items, nextCursor: result.nextCursor };
  }
  async searchPlaces(scope: RequestScope, input: PlaceSearchInput) {
    const buildings = await this.datasets.listBuildings(scope);
    const matches = (await this.datasets.listPlaces(scope, input.buildingId))
      .filter(
        (p) =>
          (!input.floorId || p.floorId === input.floorId) &&
          (!input.kind || p.kind === input.kind) &&
          (!input.stepFree || p.access.stepFreeAccess === 'verified_yes')
      )
      .map((p) => {
        const b = buildings.find((b) => b.id === p.buildingId);
        return {
          p,
          score: rank(input.query, [
            p.id,
            p.displayLabel,
            p.name,
            ...p.aliases,
            ...(b?.aliases ?? []).map((a) => `${a} ${p.roomNumber ?? p.name}`),
          ]),
        };
      })
      .filter((x) => Number.isFinite(x.score))
      .sort((a, b) => a.score - b.score || a.p.id.localeCompare(b.p.id));
    const results: PlaceSearchResult[] = matches.map(({ p, score }) => ({
      place: p,
      matchLabel: p.displayLabel,
      secondaryLabel: `${p.buildingId} · ${p.floorId === '0' ? 'Basement' : `Floor ${p.floorId}`} · ${p.provenance.verificationStatus}`,
      matchType: score === 0 ? 'exact' : score === 1 ? 'prefix' : 'contains',
      stepFreeEvaluation: null,
    }));
    const { cursor, ...filters } = input;
    const result = page(results, input.limit, cursor, [scope.dataVersion, 'places', filters]);
    return { results: result.items, nextCursor: result.nextCursor };
  }
}
