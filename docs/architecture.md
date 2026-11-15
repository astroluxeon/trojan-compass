# Trojan Compass architecture

## Runtime applications

- `web/`: Next.js/React with the existing Three.js renderer, API-backed search/chat, and API-backed Directions with a green route overlay.
- `server/`: Express/TypeScript backend shared by web and future Swift clients.
- `mobile/`: unchanged README placeholder until the mobile teammate merges.
- `demos/usc-map/`: saved local campus-map demonstration on port 3001.

## Backend layers

```text
HTTP routes → controllers → services → DatasetPort → immutable publication
                              ├── GraphStore / reachability / route overlay
                              └── IntentAdapter (server-side AI credentials)

ChatService → SearchService + RoutingService + DatasetPort
```

`bootstrap/services.ts` constructs one set of services; `createApp()` injects them without listening. `server.ts` validates environment settings and enabled publication data before accepting traffic. `lib/contracts.ts` provides runtime schema checks against the unchanged OpenAPI contract; compile-time shared types alone are not treated as validation.

Search owns ranking and signed cursor pagination. Routing validates topology/access evidence, constructs immutable directed graphs, builds request-local picked-point overlays, calculates time-weighted paths and emits route geometry/steps. Chat interprets language once, resolves canonical places through search, delegates routing, and constructs only validated actions. Navigation is optional; missing topology cannot prevent directory/search/highlight features from starting.

Building/place/scene modules are thin reads over DatasetPort. Real measured data, scene manifests, geometry/object mappings, and source navigation are still owned by the data/rendering teammate. The included normalized snapshot adapter is replaceable without changing HTTP, search, routing, chat, or mobile clients.

## Frontend boundary

Rendering, camera, gestures, animation and scene transforms remain local. Web search and chat use `lib/api-client.ts`; requests are cancellable and pinned to a data version. The temporary map-action adapter can focus known prototype buildings/floors/rooms and explicitly rejects other publications or canonical route drawing until the renderer owner supplies the scene adapter. `useRoute` cancels stale resolution and routing requests; `route-scene.ts` supplies an explicit meter-to-model transform. The Directions sidebar renders backend steps and the model renders a green path.

The five original pure prototype modules remain server-owned sources with generated browser compatibility copies. The allowlist sync and drift test remain intact. Saved-link routes retain that compatibility boundary. New Directions submissions use the explicit development-only `/api/preview/routes` service. Its visibility graph follows the displayed walls and doors; it labels all output illustrative, keeps `verifiedStepFree` false and never replaces verified routing.

## Coordinate and publication boundary

Canonical positions are building-local meters, Y up, right-handed. Geographic outdoor paths require a real WGS84 network. Prototype horizontal estimates use 2.4 meters per scene unit for LAW and 2 for generated layouts; displayed floor separation remains illustrative. These conversion assumptions are disclosed in development provenance.

The default development adapter preserves IDs and publishes search records and authored entrances. The production file adapter accepts immutable normalized bundles, validates references, and rejects demo/unreviewed building or navigation publications. Graph caches are derived in memory and never written over teammate source data. Accessibility requires positive referenced evidence throughout a path; unknown remains unknown.

For the complete architecture diagrams, APIs, internal navigation-data contract, deployment/runbook, test coverage, and remaining launch dependencies, read [backend-guide.md](backend-guide.md). [Ownership](ownership.md) and [migration](migration.md) retain the parallel-work boundaries.
