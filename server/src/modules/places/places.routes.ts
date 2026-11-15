import type { Operation } from '../../bootstrap/http-types.js';
import type { DatasetPort, SearchPort } from '../../ports/service-ports.js';
import { page } from '../search/pagination.js';
export function mountPlaces(operation: Operation, datasets: DatasetPort, search: SearchPort) {
  operation('get', '/buildings/{buildingId}/places', 'PlaceListResponse', async (s, q, p) => {
    await datasets.getBuilding(s, p.buildingId!);
    if (q.floorId) await datasets.getFloor(s, p.buildingId!, q.floorId);
    if (q.q) {
      const r = await search.searchPlaces(s, {
        query: q.q,
        buildingId: p.buildingId!,
        floorId: q.floorId,
        kind: q.kind,
        limit: q.limit ?? 20,
        cursor: q.cursor,
      });
      return { items: r.results.map((r) => r.place), nextCursor: r.nextCursor };
    }
    const items = (await datasets.listPlaces(s, p.buildingId!)).filter(
      (place) => (!q.floorId || place.floorId === q.floorId) && (!q.kind || place.kind === q.kind)
    );
    return page(items, q.limit ?? 20, q.cursor, [
      s.dataVersion,
      p.buildingId,
      q.floorId,
      q.kind,
      q.limit ?? 20,
    ]);
  });
  operation(
    'get',
    '/buildings/{buildingId}/places/{placeId}',
    'PlaceResponse',
    async (s, q, p) => ({ place: await datasets.getPlace(s, p.buildingId!, p.placeId!) })
  );
}
