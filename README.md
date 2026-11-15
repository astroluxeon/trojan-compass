# Trojan Compass

USC building exploration with a working web demo and an implemented shared backend. The repository is organized for parallel web, backend, and mobile work.

## Layout

```text
trojan-compass/
├── web/                          # Next.js + React + Three.js
│   ├── public/                   # Existing images and Trojan guide model
│   └── src/
│       ├── app/                  # Pages and layout
│       ├── components/           # Shared layout and UI
│       ├── features/
│       │   ├── map/              # Renderer, camera, picking and map state
│       │   ├── search/           # Search UI + temporary generated demo logic
│       │   ├── routing/          # Directions UI + temporary generated demo logic
│       │   ├── chat/             # API-backed assistant and action bridge
│       │   └── events/           # Deferred feature
│       └── lib/                  # Cancellable, versioned API client
├── mobile/                       # Placeholder for teammate's Swift app
├── server/
│   ├── src/
│   │   ├── modules/              # buildings, scenes, places, search, routing, chat, events
│   │   ├── infrastructure/       # Prototype adapter + immutable snapshot loader
│   │   ├── integrations/ai/      # Structured intent provider adapter
│   │   ├── ports/                # Agreed in-process interfaces
│   │   ├── bootstrap/            # Dependency-injected service composition
│   │   ├── config/               # Environment settings
│   │   ├── middleware/           # HTTP error boundary
│   │   ├── app.ts                # Mounted validated API routes
│   │   └── server.ts             # Process entry point
│   ├── data/                     # Teammate publication/event inputs
│   └── tests/                    # Contract, HTTP, routing, chat and data tests
├── shared/
│   ├── contracts/                # Agreed OpenAPI, not implementation status
│   ├── typescript/               # Compile-time API types
│   └── fixtures/                 # Synthetic API examples for both clients
├── demos/usc-map/                # Existing saved campus-map demo
├── docs/                         # Architecture, ownership, API status and migration
└── scripts/                      # Compatibility sync and mascot model generation
```

## Run locally

Use Node.js 22.9 or later, npm, and Python 3. Run these from the repository root:

```sh
npm install
npm run dev:demo       # campus map (3001) and interior viewer (3000)
npm run dev:server     # separate terminal: Express (4000)
```

Open <http://localhost:3001> or <http://localhost:3000/?building=LAW&floor=1>.
Health: <http://127.0.0.1:4000/api/health>.

Keep `npm run dev:demo` running while using the demo. Stop separately running
`dev:web` or `dev:campus` processes first to avoid port conflicts. Opening port
3000 without a building redirects to the campus map on port 3001, so both sites
must be running. The campus server accepts IPv4 and IPv6 localhost connections;
the interior server stays on port 3000.

`npm run dev` starts web + server; `npm run dev:api` remains an alias for existing workflows. `npm run dev:web` starts only the viewer. `npm run dev:campus` starts only the saved map. The demo links still assume ports 3000/3001.

Defaults work without environment files. Copy `web/.env.example` to `web/.env.local` and `server/.env.example` to `server/.env` to customize the API proxy/server. Restart after changes. Mobile is not an npm workspace.

```sh
npm run sync:legacy    # refresh generated browser copies after editing prototype server sources
npm test              # compatibility drift + web, backend, and campus-demo tests
npm run typecheck
npm run build
```

After building, run `npm run start --workspace=@trojan-compass/api` and `npm run start --workspace=@trojan-compass/web` in separate terminals. Package names remain stable despite the folder move.

## Current implementation

The viewer renders buildings/floors, searches local room codes, highlights rooms, places an animated guide, and draws routes from saved links. Working panels are now separated by feature.

The shared backend implements directory/place/scene reads, ranked search, optional canonical routing, AI intent orchestration, validated actions, versioned snapshots, cancellation, limits, and structured errors. Web Search and Chat now use the API. Enable the real assistant through `AI_PROVIDER=openai`, `OPENAI_API_KEY`, and `OPENAI_MODEL`; otherwise chat explicitly reports that it is unavailable. The existing renderer accepts prototype highlights and draws green Directions routes from the explicit development-only preview API. The sidebar supports map picks, stair/elevator preferences and following route steps. Saved-link routes retain their older compatibility path. Mobile remains a placeholder; no accounts or public editing were added.

Routes, accessibility and most building interiors remain demo data. LAW is source-derived from a traced plan, not a verified navigation survey. The canonical route engine is implemented and tested against synthetic topology; it requires the teammate’s reviewed navigation publication before enabling real campus routes. It never exposes the old guessed graph as a verified API route.

Read the [backend implementation and deployment guide](docs/backend-guide.md), [architecture](docs/architecture.md), [team ownership](docs/ownership.md), [API status](docs/api.md), and [migration notes](docs/migration.md) before continuing parallel work. The older detailed backend/mobile handoffs remain background references; the current ownership and API documents resolve their outdated paths and scope.

## Demo assets

`demos/usc-map` reuses the saved USC page, tiles, public directory and footprints from <https://maps.usc.edu/?id=1928>. It is a local demonstration. The header monogram comes from [USC Brand and Identity](https://identity.usc.edu/identity/logos-marks/). The Trojan guide model remains in `web/public/models/`; `scripts/build-tommy.py` rebuilds it with Blender.
