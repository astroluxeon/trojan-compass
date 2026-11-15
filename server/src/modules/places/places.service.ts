// See docs/ownership.md and src/ports/service-ports.ts; no endpoint is implemented here yet.
import type { DatasetPort, RequestScope } from "../../ports/service-ports.js";
export class PlacesService {
  constructor(private readonly datasets: DatasetPort) {}
  get(scope: RequestScope, buildingId: string, placeId: string) {
    return this.datasets.getPlace(scope, buildingId, placeId);
  }
}
