# API implementation status

The agreed specification is `../shared/contracts/openapi.yaml`. Paths below include `/api`; the specification uses a server URL ending in `/api` with relative paths.

| Status | Method and path | Owner |
| --- | --- | --- |
| Implemented | `GET /api/health` | Eddie |
| Planned | `GET /api/buildings` | Eddie search + teammate data |
| Planned | `GET /api/buildings/{buildingId}` | Teammate |
| Planned | `GET /api/buildings/{buildingId}/scene` | Teammate |
| Planned | `GET /api/buildings/{buildingId}/floors` | Teammate |
| Planned | `GET /api/buildings/{buildingId}/floors/{floorId}` | Teammate |
| Planned | `GET /api/buildings/{buildingId}/places` | Teammate reads + Eddie ranking |
| Planned | `GET /api/buildings/{buildingId}/places/{placeId}` | Teammate |
| Planned | `GET /api/places` | Eddie |
| Planned | `POST /api/routes` | Eddie |
| Planned | `POST /api/chat` | Eddie |
| Optional | `GET /api/buildings/{buildingId}/graph` | Eddie |
| Deferred | `GET /api/events`, `GET /api/events/{eventId}` | Unassigned |

Unimplemented routes still return the existing 404 response. The shared contract error envelope, validation and request scope will be integrated with the feature routers. No scaffolding is mounted as if it were complete.

Next.js proxies `/api/*` to `API_BASE_URL`. Mobile will call the server directly over its configured HTTPS address. Secrets stay server-side. API requests/responses, snapshot IDs and structured actions must match the contract across both clients.
