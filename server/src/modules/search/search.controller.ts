// See docs/ownership.md and src/ports/service-ports.ts; no endpoint is implemented here yet.
import type { Services } from "../../bootstrap/services.js";
import { getEndpoint, searchInput } from "../../lib/http.js";
export const searchController = (services: Services) =>
  getEndpoint(
    services,
    "/places",
    "PlaceSearchResponse",
    async ({ scope, query }) => {
      const result = await services.search.searchPlaces(
        scope,
        searchInput(query),
      );
      return { items: result.results, nextCursor: result.nextCursor };
    },
  );
