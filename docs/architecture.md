# Trojan Compass architecture

Next.js and the SwiftUI/WKWebView iPhone shell use the same Express service. The embedded viewer owns requests and map state on iPhone; native code does not submit duplicate search, route or chat requests.

## Backend

`app.ts` handles request scope, contract validation, time budgets, caching, shared HTTP errors and feature mounting. Feature bindings live in each module's `*.routes.ts`. `bootstrap/create-services.ts` composes `DatasetPort`, `SearchPort`, `RoutingPort` and `ChatPort` once.

The snapshot repository implements canonical building, floor, place, scene, floor geometry and navigation-source reads. Search normalizes labels and aliases, ranks records and binds pagination cursors to filters and snapshot. Routing constructs and validates graphs, rejects wall-crossing source edges, validates picked positions, enforces route preferences, calculates paths and returns legs and anchored instructions. Graphs are cached in memory by building and dataVersion. Virtual picked nodes are confined to an individual request.

Chat validates context, uses an injected intent provider, resolves real records through search and calls the exact same routing service as manual directions. It returns only supported actions. Services call each other in process, never through loopback HTTP. The local provider interprets explicit commands; the optional external adapter returns a constrained intent and cannot supply authoritative map geometry.

## Viewer

`api-viewer.ts` stages the building, scene and floor responses for an entire action batch. It checks versions and scene bindings before commit. `viewer-data.ts` adapts loaded records into presentation state; it contains no canonical layout generation or search/pathfinding. Camera, gestures, labels, picking and guide animation remain client-side. Prepared wall boxes come from the server. Numeric floor IDs and procedural box scenes are supported by the current renderer; unsupported representations fail explicitly.

The schematic campus overview's local positions and footprints are presentation decoration and never feed route calculation or geographic coordinates. The saved campus demo is separately retained under demos.

## Data

The current snapshot is an explicit extraction of the existing traced/generated prototypes. It preserves public IDs and includes provenance, calibration and separate navigation source files. Topology, walkable centerlines, wall barriers and connector core memberships are source input. Derived adjacency and request anchors remain in memory.

The prototype sources remain server-side for regression coverage and reproducible extraction. They are not mounted directly as the canonical route API. Synthetic shared fixtures are contract examples, not runtime datasets.

## Contract

OpenAPI YAML is authoritative. `npm run contract:generate` produces JSON and TypeScript aliases; `contract:check` checks artifact drift and all indexed positive/negative fixtures. AJV validates live requests, dataset records and successful responses. Shared TypeScript exports remain type-only; there is no implicit runtime-schema package export.

## Limits

All navigation/access claims remain unverified. No outdoor routing network, surveyed accessibility, model building assets, events or image-input pipeline is supplied. iOS and a live external provider require their own environment verification.
