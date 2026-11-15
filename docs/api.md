# API implementation status

`shared/contracts/openapi.yaml` is the agreed public contract. Paths below include `/api`; the specification uses an API base URL ending in `/api`.

| Status | Method and path | Data/behavior |
| --- | --- | --- |
| Implemented | `GET /api/health` | Process health; independent of temporary AI failure. |
| Implemented | `GET /api/buildings` | Directory, aliases, ranked search, signed pagination. |
| Implemented | `GET /api/buildings/{buildingId}` | Pinned metadata and capabilities from DatasetPort. |
| Implemented | `GET /api/buildings/{buildingId}/scene` | Published scene; 501 if absent, 406 if representation unavailable. |
| Implemented | `GET /api/buildings/{buildingId}/floors` | Ordered floor metadata. |
| Implemented | `GET /api/buildings/{buildingId}/floors/{floorId}` | Floor, optional geometry, and places. |
| Implemented | `GET /api/buildings/{buildingId}/places` | Scoped listing/search and pagination. |
| Implemented | `GET /api/buildings/{buildingId}/places/{placeId}` | Canonical place details. |
| Implemented | `GET /api/places` | Global/scoped search with optional verified reachability filter. |
| Implemented, data-dependent | `POST /api/routes` | Directed graph paths, endpoint geometry/access validation, canonical route. |
| Implemented, provider-dependent | `POST /api/chat` | Intent interpretation, canonical resolution, actions, clarification, optional route. |
| Implemented, disabled by default | `GET /api/buildings/{buildingId}/graph` | Source-graph inspection, enabled through EXPOSE_GRAPH. |
| Deferred, explicit 501 | `GET /api/events`, `GET /api/events/{eventId}` | No event source connected. |

Image input is deliberately disabled with `IMAGE_INPUT_DISABLED`. No accounts, authentication endpoints, campus-code module, or public administration endpoints were added.

All mounted handlers validate input and return the shared response/error envelopes. Data versions are immutable. Body and query limits, UUID/request ID handling, deadlines, cancellation, CORS, rate limits, ETags, and safe error messages are implemented. Runtime schema checks use the unchanged shared OpenAPI contract.

The development `prototype-v1` adapter supports directory/search/highlights over existing records. It does not publish verified navigation or canonical scene assets. Configure the real AI provider to use chat, and supply teammate-owned publication data to enable scene reads and navigation. The web search and chat panels now use the API; rendering and saved-route compatibility still use the old viewer until its scene adapter is merged.

See [the backend guide](backend-guide.md) for parameters, service workflow diagrams, route policies, clarification examples, data publication format, deployment settings, and client responsibilities. Next.js proxies `/api/*`; Swift calls the same hosted HTTPS API directly.

## Development route previews

`POST /api/preview/routes` uses the existing `RouteRequest` / `RouteResponse` shapes for the current illustrated model. It is available only with non-production `DATASET_MODE=prototype`. It returns demo/unverified provenance and never sets `verifiedStepFree` to true. The main Directions panel explicitly selects this endpoint for its prototype model; there is no fallback from `/api/routes`. This extension is not part of the production/mobile navigation contract.
