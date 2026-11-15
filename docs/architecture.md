# Trojan Compass architecture

## Runtime applications

- `web/`: Next.js/React with the existing Three.js viewer.
- `server/`: Express/TypeScript shared by the web and future mobile clients.
- `mobile/`: README placeholder until the mobile teammate merges their app.
- `demos/usc-map/`: existing local campus-map demo on port 3001.

## Existing code now in its target location

The working renderer lives in `web/src/features/map/renderer/`. Camera math, map picking, saved-link state, floor tools, and view types remain client-side. Search, Directions, and Chat have separate components in their feature directories. UI composition stays in `Wayfinder` and `FloorTools`.

Existing building metadata, LAW tracing, and procedural floorplan functions are preserved in `server/src/infrastructure/datasets/prototype/`. Existing route graph construction/pathfinding is in `server/src/modules/routing/prototype/`; existing autocomplete matching is in `server/src/modules/search/prototype/`. These pure modules compile and run in Node without React or Three.js.

The browser currently consumes generated compatibility copies of those five modules. `scripts/sync-legacy-browser.mjs` copies only an explicit allowlist and rewrites internal imports. No browser module imports arbitrary server code. `npm test` checks that the copies match; web dev/build refreshes them. Replace the copies with API responses when the corresponding backend features are ready.

## Backend layers

```text
routes → controller → service → dataset repository / integration
                       └────→ other in-process service interfaces
```

Routes define HTTP bindings and validation. Controllers translate HTTP input/output. Services own search, routes, and AI decisions. Dataset repositories supply records and geometry; AI integration holds provider credentials. The frontend owns rendering, camera, gestures and animation.

Feature controllers/routes/services are intentionally unfinished scaffolds. `server/src/ports/service-ports.ts` contains the copied team agreement. `shared/contracts/openapi.yaml` governs the HTTP contract; shared TypeScript types provide compile-time assistance only.

## What actually works

The current demo still opens building links, switches floors, highlights searched rooms, filters suggestions, places the Trojan guide, and draws routes from saved links. Search and route algorithms can also be exercised directly in Node.

Only `GET /api/health` is mounted. The viewer does not yet fetch building, search, scene or route data. Directions submit is a preview, chat is canned, and events have no connected feed. There is no database, provider integration, or published canonical snapshot.

## Coordinate and access boundary

The prototype uses scene units and schematic campus positions. LAW horizontal estimates use 2.4 meters per scene unit; generated layouts use 2; floor separation is 3.4 scene units. The desired API uses building-local meters with Y up and geographic coordinates for outdoor paths. Teammate-owned calibration must bridge these representations before publishing a snapshot.

The old nearest-node connections, schematic cross-building route, and step-free assumptions are preserved demo behavior, not verified navigation. Do not mount the prototype output directly as the agreed route API. Eddie must add geometry/access validation and canonical response serialization. Unknown accessibility remains unknown.

See `ownership.md` for parallel responsibilities and `migration.md` for the exact extraction boundary.
