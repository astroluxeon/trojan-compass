# Trojan Compass

USC building exploration with one Express/TypeScript backend for Next.js web and an embedded Swift iPhone client. The existing Three.js viewer, camera controls, floor selection, guide animation, campus demo and saved room links are retained.

## Run

Use Node.js 22.9 or later and npm. The optional saved campus demo also needs Python 3.

```sh
npm install
npm run dev           # web :3000 and API :4000
npm run dev:demo      # also starts saved campus demo :3001
```

Open http://localhost:3000/?building=LAW&floor=1. Search `LAW 101`, calculate directions from `LAW 101` to `LAW 107`, or ask chat `Show LAW 101` and `Route from LAW 101 to LAW 107`.

Copy `server/.env.example` to `server/.env` and `web/.env.example` to `web/.env.local` when changing addresses. Restart after changes. Public API and viewer URLs must be reachable from the consuming device. The web proxy uses `API_BASE_URL`; iPhone uses `COMPASS_VIEWER_URL` in Xcode. Never publish provider credentials in a frontend environment variable.

## Implemented behavior

The backend serves directory, building, floor, place and procedural scene reads; normalized building/place search; versioned indoor routes with geometry and instructions; and chat clarification and structured actions. HTTP input and output are validated against the agreed OpenAPI schema. Dataset responses include their snapshot, pagination and stable ETags. Errors use the shared envelope.

The web loads prepared geometry from that backend and executes the same actions as the mobile viewer. It does not perform search ranking or pathfinding. Scene changes are staged before committing; failed requests preserve the previous map and drafts. The legacy generated browser datasets and search/pathfinding copies have been removed.

Chat defaults to a deterministic local command interpreter. It is not a live AI model. Set `AI_MODE=openai`, `AI_MODEL` and `AI_API_KEY` to enable the optional OpenAI-compatible structured intent adapter. Search and routing still resolve all records and paths on the server. Provider transport and failure handling are tested with injected responses; a live paid provider needs local credentials.

## Data and scope

`server/data/snapshots/current.json` selects the active snapshot, currently `usc-interiors-2026-11-14`. The original `usc-demo-2026-11-14` baseline is retained. Both contain nine buildings: LAW is traced from the existing Gould plan, while the new snapshot adds inferred reconstructions for the other interiors. Horizontal scales are estimated (LAW 2.4 meters per old scene unit; other interiors 2), and floor spacing is assumed to be 3.4 meters. Geometry, place coordinates and route points use building-local meters with Y up.

These are unverified illustrative routes. Accessibility remains unknown; step-free requests fail explicitly rather than falling back to stairs. Cross-building routes fail with `OUTDOOR_NETWORK_UNAVAILABLE` because no authoritative outdoor network is supplied. Events, image input and graph inspection are disabled. There are no accounts or public editing.

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

Start production with `npm run start --workspace=@trojan-compass/api` and `npm run start --workspace=@trojan-compass/web`. Include `server/data/` and `shared/contracts/` in the deployment alongside server build output. Dataset resolution does not depend on the shell working directory.

See [ownership](docs/ownership.md), [decisions](docs/decisions.md), [API status](docs/api.md), and [verification](docs/verification.md). iOS compilation/device testing requires macOS and Xcode; it cannot be established by the Windows web build.
