import type { Operation } from '../../bootstrap/http-types.js';
import type { DatasetPort, SearchPort } from '../../ports/service-ports.js';
export function mountBuildings(operation: Operation, datasets: DatasetPort, search: SearchPort) {
  operation('get', '/buildings', 'BuildingListResponse', async (s, q) => {
    const r = await search.searchBuildings(s, {
      query: q.q ?? '',
      limit: q.limit ?? 20,
      cursor: q.cursor,
    });
    return { items: r.buildings, nextCursor: r.nextCursor };
  });
  operation('get', '/buildings/{buildingId}', 'BuildingResponse', async (s, q, p) => ({
    building: await datasets.getBuilding(s, p.buildingId!),
  }));
  operation('get', '/buildings/{buildingId}/floors', 'FloorListResponse', async (s, q, p) => ({
    items: (await datasets.getBuilding(s, p.buildingId!)).floors.sort(
      (a, b) => a.sortOrder - b.sortOrder
    ),
    nextCursor: null,
  }));
  operation(
    'get',
    '/buildings/{buildingId}/floors/{floorId}',
    'FloorResponse',
    async (s, q, p) => ({
      floor: await datasets.getFloor(s, p.buildingId!, p.floorId!),
      geometry: await datasets.getFloorGeometry(s, p.buildingId!, p.floorId!),
      places: (await datasets.listPlaces(s, p.buildingId!)).filter(
        (place) => place.floorId === p.floorId
      ),
    })
  );
}
