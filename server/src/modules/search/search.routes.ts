import type { Operation } from '../../bootstrap/http-types.js';
import type { DatasetPort, SearchPort } from '../../ports/service-ports.js';
import { invalid } from '../../middleware/failure.js';
export function mountSearch(operation: Operation, datasets: DatasetPort, search: SearchPort) {
  operation('get', '/places', 'PlaceSearchResponse', async (s, q) => {
    if (q.buildingId) await datasets.getBuilding(s, q.buildingId);
    if (q.floorId && !q.buildingId) invalid('A floor filter requires a building.');
    if (q.floorId) await datasets.getFloor(s, q.buildingId, q.floorId);
    const r = await search.searchPlaces(s, {
      query: q.q ?? '',
      buildingId: q.buildingId,
      floorId: q.floorId,
      kind: q.kind,
      stepFree: q.stepFree,
      limit: q.limit ?? 20,
      cursor: q.cursor,
    });
    return { items: r.results, nextCursor: r.nextCursor };
  });
}
