# Trojan Compass

A hackathon project to help USC first years and transfer students find unfamiliar
classrooms, club meetings, campus events, and exams through a 3D building map.
Planned features include toilets, stairs, elevators, accessible paths, highlighted
doors/entrances, emergency exit markers, and an AI navigation assistant.

## Stack

- **Web:** Next.js App Router, React, TypeScript.
- **3D:** Three.js, React Three Fiber, and Drei installed for the future viewer.
- **API:** Node.js, Express, TypeScript.
- **Workspace:** npm workspaces with shared TypeScript contracts.

Next.js provides the React build tooling, so this workspace does not need Vite.

## Get started

Use Node.js 22.9 or later and npm. From the repository root:

```sh
npm install
npm run dev
```

- Frontend: <http://localhost:3000>
- API health: <http://127.0.0.1:4000/api/health>
- Health through the frontend proxy: <http://localhost:3000/api/health>

Defaults work without environment files. To customize, copy
`apps/web/.env.example` to `apps/web/.env.local` and
`apps/api/.env.example` to `apps/api/.env`. Restart the affected process after
changing environment variables. Keep the web API address aligned with the API port.

```sh
npm run dev:web       # frontend only
npm run dev:api       # backend only
npm run typecheck     # all workspace TypeScript checks
npm run build         # check shared types and build both apps
```

After building, start each service in its own terminal:

```sh
npm run start --workspace=@trojan-compass/api
npm run start --workspace=@trojan-compass/web
```

## Structure

```text
trojan-compass/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   │   ├── models/                 # building GLB/GLTF assets
│   │   │   └── images/
│   │   └── src/
│   │       ├── app/                    # home, /map, /events
│   │       ├── components/ui/          # shared UI
│   │       ├── features/
│   │       │   ├── map/                # 3D viewer, floors, highlights
│   │       │   ├── search/             # rooms and amenities
│   │       │   ├── routing/            # route controls and accessibility
│   │       │   ├── events/             # event discovery
│   │       │   └── chat/               # AI navigation interface
│   │       └── lib/                    # API helpers
│   └── api/src/
│       ├── config/                    # environment settings
│       ├── modules/
│       │   ├── buildings/             # metadata, room and amenity lookup
│       │   ├── routing/               # graph paths and accessibility
│       │   ├── events/                # events and classroom destinations
│       │   └── chat/                  # natural language/image intent
│       ├── lib/                       # AI adapter and data loader
│       ├── middleware/
│       ├── app.ts                     # Express app and health endpoint
│       └── server.ts                  # process entry point
├── packages/shared/src/types/         # building, place, route, event, chat
├── data/
│   ├── buildings/                     # floor metadata and routing graphs
│   └── events/                        # demo event records
└── docs/                              # architecture and endpoint plan
```

## UI development

The Figma mockup is integrated into the existing Next.js web workspace. `/` and
`/map` open the full-width interactive viewer. `/events` currently opens the same viewer.
Run `npm run dev` from the root and edit files in `apps/web/src` for live reload.
If port 3000 is occupied, run `npm run dev --workspace=@trojan-compass/web -- --port 3001`.

- `components/Wayfinder.tsx`: page state, navigation, and panel composition.
- `components/ui/`: USC header, toast, floor controls, and map overlays.
- `components/map/`: Three.js campus and floor scenes.
- `data/campus.ts`, `data/floorplan.ts`, `data/law.ts`: mockup data and floor geometry.
- `app/globals.css`: Tailwind theme, colors, and global styles.

The imported viewer uses local sample events, generated classroom layouts, and a
LAW plan traced by the mockup author. Routes and accessibility details are demo
behavior, not verified campus directions. The Express API and shared contracts
remain in place; the viewer does not yet fetch them. AI chat is still a placeholder.

Run the routing smoke tests with:

```sh
node --import tsx --test apps/web/tests/routing.test.ts
```

The header monogram asset comes from [USC Brand and Identity](https://identity.usc.edu/identity/logos-marks/) ([original PNG](https://identity.usc.edu/wp-content/uploads/2022/08/TheMonogram.png)).
