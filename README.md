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

Use Node.js 22.9 or later, npm, and Python 3. From the repository root:

```sh
npm install
npm run dev:demo
```

- Campus map: <http://localhost:3001>
- Building interiors: <http://localhost:3000/?building=LAW&floor=1>

The demo runs both frontend sites. The optional API starts separately with
`npm run dev:api`; its health endpoint is <http://127.0.0.1:4000/api/health>.

Defaults work without environment files. To customize, copy
`apps/web/.env.example` to `apps/web/.env.local` and
`apps/api/.env.example` to `apps/api/.env`. Restart the affected process after
changing environment variables. Keep the web API address aligned with the API port.

```sh
npm run dev:web       # frontend only
npm run dev:api       # backend only
npm test              # frontend regression tests in both demo sites
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

### Two-site campus demo

Run `npm run dev:demo` to start both frontend sites together, or run these in
separate terminals:

```sh
npm run dev:web       # Trojan Compass interiors, http://localhost:3000
npm run dev:campus    # USC campus map replica, http://localhost:3001 (Python 3)
```

Start at <http://localhost:3001>. Click a building footprint or search for a building
such as `LAW`. The nine supported buildings open their matching Trojan Compass
interior on port 3000. "All buildings" returns to port 3001. Opening port 3000
without a building also returns to the campus demo.

`apps/campus-demo` reuses the supplied saved USC page and its map tiles, with a
local copy of the public building directory and footprints from
<https://maps.usc.edu/?id=1928>. It is a local demonstration, not the official site.
The saved map covers University Park Campus; Health Sciences, extra categories,
tours and Street View link to or point users to the official site. Unsupported
buildings show an availability message instead of opening the wrong interior.
No USC application scripts, analytics, or backend services run in the replica.

Edit `demo.js` and `demo.css`, then refresh port 3001 to see changes. Port 3000
continues to support automatic updates. Run the demo checks with
`npm test --workspace=@trojan-compass/campus-demo`.

The Figma mockup is integrated into the existing Next.js web workspace. Building
links such as `/?building=LAW&floor=1` open the interactive interior viewer.
Run `npm run dev:web` from the root and edit files in `apps/web/src` for live reload.
Port 3001 is reserved for the campus demo; keep the interior viewer on port 3000
so links between the two sites work.

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
