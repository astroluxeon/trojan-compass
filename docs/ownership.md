# Parallel work ownership

The top-level directory migration is applied. Use these paths instead of the older `apps/` paths in the original team separation document.

| Owner | Responsibility | Paths |
| --- | --- | --- |
| Eddie | Search, ranking and resolution | `server/src/modules/search/` |
| Eddie | Graph construction, route validation, pathfinding and instructions | `server/src/modules/routing/` |
| Eddie | Chat, AI provider and structured actions | `server/src/modules/chat/`, `server/src/integrations/ai/` |
| Eddie | Server composition and HTTP integration | `server/src/app.ts`, `server/src/bootstrap/`, `server/src/middleware/` |
| Teammate | Building/floor/place data and detail reads | `server/src/modules/buildings/`, `server/src/modules/places/`, `server/src/infrastructure/datasets/`, `server/data/` |
| Teammate | Scene data, geometry, calibration and object mappings | `server/src/modules/scenes/`, snapshot geometry |
| Teammate | Working viewer, camera, gestures and highlights | `web/src/features/map/` (generated copies excluded) |
| Mobile teammate | Mobile UI, networking and viewer choice | `mobile/` |
| Affected owners together | HTTP contract, fixture and interface changes | `shared/`, `server/src/ports/service-ports.ts` |

## Navigation source versus graph output

The data/rendering teammate provides source corridors, walkable areas, barriers, doors, entrances, and vertical connectors. Eddie converts these into routing graphs, validates them, and owns derived caches. Source `navigation/` files belong to the teammate. Cache files do not belong there.

`DatasetPort`, `SearchPort`, `RoutingPort`, and `ChatPort` are copied from the agreed handoff. They are proposed interfaces, not implementations. `NavigationSource` currently covers nodes/edges only; agree on the walkable geometry query needed before accepting arbitrary position endpoints. No new public API is needed just to refine this internal input.

Building listing uses teammate records plus Eddie's search matching. Building-scoped place search delegates ranking to Eddie. Dataset reads must not depend on routing; service calls within this process use interfaces, not HTTP self-calls.

## Editing prototype logic

The moved prototype files preserve existing demo behavior. Edit the server sources and run `npm run sync:legacy`; commit the generated browser compatibility copies with the change. The allowlist is `scripts/legacy-browser-manifest.json`. These copies are temporary and must not become independent implementations.

The web panels are separated under `features/search`, `features/routing`, and `features/chat`; `features/map/components/FloorTools.tsx` coordinates their state. Wire each panel to its backend service when ready. Until then search and saved-link routes use the compatibility code; chat is canned and Directions submit is a preview.

## Still to implement

Eddie: canonical search and route adapters, request/response validation, explicit access policies, AI orchestration/provider, controllers, router mounting, and async client integration.

Teammate: calibrated and validated dataset snapshots, DatasetPort implementation, scene/geometry delivery, stable scene object mappings, and API-backed rendering.

Mobile teammate: merge the Swift application into the placeholder and decode the same contract. No accounts, public editing, or campus-code module is part of this scope. Events/image input remain deferred.
