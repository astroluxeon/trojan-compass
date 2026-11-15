# Trojan Compass

USC building exploration with one Express/TypeScript backend for Next.js web and an embedded Swift iPhone client. The existing Three.js viewer, camera controls, floor selection, guide animation, campus demo and saved room links are retained.

## Run

Use Node.js 22.9 or later and npm. The optional saved campus demo also needs Python 3.

```sh
npm install
npm run dev           # web :3000 and API :4000
npm run dev:demo      # also starts saved campus demo :3001
```

Open http://localhost:3000/?building=LAW&floor=1. Search `LAW 101`, calculate directions from `LAW 101` to `LAW 107`, or configure AI below and ask chat `Show LAW 101` and `Route from LAW 101 to LAW 107`.

Copy `server/.env.example` to `server/.env` and `web/.env.example` to `web/.env.local` when changing addresses. Restart after changes. Public API and viewer URLs must be reachable from the consuming device. The web proxy uses `API_BASE_URL`; iPhone uses `COMPASS_VIEWER_URL` in Xcode. Never publish provider credentials in a frontend environment variable.

## Implemented behavior

The backend serves directory, building, floor, place and procedural scene reads; normalized building/place search; versioned indoor routes with geometry and instructions; and chat clarification and structured actions. HTTP input and output are validated against the agreed OpenAPI schema. Dataset responses include their snapshot, pagination and stable ETags. Errors use the shared envelope.

The web loads prepared geometry from that backend and executes the same actions as the mobile viewer. It does not perform search ranking or pathfinding. Scene changes are staged before committing; failed requests preserve the previous map and drafts. The legacy generated browser datasets and search/pathfinding copies have been removed.

The Seaweed UI integration restores the updated Trojan guide, drag/double-click interactions, three dances, shared stair icons and zoom-dependent room labels. Drag the guide to move it, or double-click it (or focus its label and press `D`) to dance. See [feature reconciliation](docs/seaweed-integration.md) for source provenance and ownership without duplicate implementations.

Chat is disabled until `AI_PROVIDER=openai`, `OPENAI_API_KEY` and `OPENAI_MODEL` are configured in the server environment. The provider uses a strict intent schema; our search and routing services resolve all records and paths. With AI disabled, the API returns an explicit `FEATURE_DISABLED` error and the chat draft is preserved. Provider behavior is tested with injected responses; live model quality requires a configured provider. See [backend setup](docs/backend-guide.md).

## Data and scope

`server/data/snapshots/current.json` selects the active snapshot, currently `usc-interiors-2026-11-14`. The original `usc-demo-2026-11-14` baseline is retained. Both contain nine buildings: LAW is traced from the existing Gould plan, while the new snapshot adds inferred reconstructions for the other interiors. Horizontal scales are estimated (LAW 2.4 meters per old scene unit; other interiors 2), and floor spacing is assumed to be 3.4 meters. Geometry, place coordinates and route points use building-local meters with Y up.

These are unverified illustrative routes. Accessibility remains unknown; step-free requests fail explicitly rather than falling back to stairs. Cross-building routes fail with `OUTDOOR_NETWORK_UNAVAILABLE` because no authoritative outdoor network is supplied. Events and image input are disabled; graph inspection is off by default. There are no accounts or public editing. [Integration review](docs/integration-review.md) lists the five known LAW destination/mode gaps and the regression coverage.

## Repository

- `web/`: Next.js client, existing renderer and feature panels.
- `mobile/`: SwiftUI/WKWebView iPhone project, shared fixture decoders and Mac verification instructions.
- `server/`: HTTP modules, snapshot repository, search, graph construction, routing and chat.
- `shared/contracts/`: authoritative OpenAPI YAML and generated equivalent JSON.
- `shared/typescript/`: generated compile-time wire models; runtime validation stays on the server.
- `shared/fixtures/`: synthetic contract examples, separate from published demo snapshots.
- `docs/`: architecture, ownership, decisions, migration and verification.
- `demos/usc-map/`: retained saved USC campus map.
- `scripts/`: contract generation and existing asset tooling.

Package names remain `@trojan-compass/web`, `@trojan-compass/api` and `@trojan-compass/shared`. Mobile is not an npm workspace.

## Checks

```sh
npm test
npm run typecheck
npm run build
npm run smoke             # after building, with the default proxy port 4000 free
npm run contract:generate  # after intentional OpenAPI changes
npm run data:extract       # explicit prototype extraction; do not overwrite published versions after release
```

For production, set `NODE_ENV=production`, a stable `CURSOR_SECRET`, reviewed `DATASET_ROOT`, public viewer/API origins and any AI settings before running `npm run start --workspace=@trojan-compass/api` and `npm run start --workspace=@trojan-compass/web`. The bundled unverified dataset is intentionally rejected by production admission. Include `server/data/` and `shared/contracts/` in the deployment alongside server build output. Dataset resolution does not depend on the shell working directory.

See [ownership](docs/ownership.md), [decisions](docs/decisions.md), [API status](docs/api.md), and [verification](docs/verification.md). iOS compilation/device testing requires macOS and Xcode; it cannot be established by the Windows web build.
