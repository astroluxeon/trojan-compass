# Graph Report - trojan-compass  (2026-11-14)

## Corpus Check
- 85 files · ~85,893 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 492 nodes · 797 edges · 47 communities (20 shown, 26 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `995a595e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- floorplan.ts
- BuildingScene.tsx
- Wayfinder.tsx
- Panels.tsx
- compilerOptions
- dependencies
- scripts
- api/package.json
- route.ts
- compilerOptions
- demo.js
- FeaturePlaceholder.tsx
- compilerOptions
- shared/package.json
- compilerOptions
- Trojan Compass architecture
- server.ts
- layout.tsx
- Trojan Compass
- RoadmapSheet.tsx
- ai-client.ts
- data-loader.ts
- error-handler.ts
- buildings.routes.ts
- buildings.service.ts
- chat.routes.ts
- chat.service.ts
- events.routes.ts
- events.service.ts
- routing.routes.ts
- routing.service.ts
- AGENTS.md
- next.config.ts
- next-env.d.ts
- models/README.md
- FloorSelector.tsx
- RoomHighlight.tsx
- RouteOverlay.tsx
- useBuilding.ts
- useRoute.ts
- api-client.ts
- buildings/README.md
- events/README.md
- api.md
- routing.ts
- campus-demo/package.json

## God Nodes (most connected - your core abstractions)
1. `BuildingCode` - 19 edges
2. `floorName()` - 17 edges
3. `getLevels()` - 17 edges
4. `getLayout()` - 15 edges
5. `cellCenter()` - 14 edges
6. `floorY()` - 12 edges
7. `cellTitle()` - 12 edges
8. `getBuildingPlaces()` - 11 edges
9. `compilerOptions` - 11 edges
10. `init()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `BuildingHeader()` --calls--> `getLevels()`  [EXTRACTED]
  apps/web/src/components/ui/Panels.tsx → apps/web/src/data/floorplan.ts
- `readDeepLink()` --calls--> `getLevels()`  [EXTRACTED]
  apps/web/src/components/Wayfinder.tsx → apps/web/src/data/floorplan.ts
- `readDeepLink()` --calls--> `computeRoute()`  [EXTRACTED]
  apps/web/src/components/Wayfinder.tsx → apps/web/src/lib/routing.ts
- `searchLocation()` --calls--> `findRoom()`  [EXTRACTED]
  apps/web/src/components/Wayfinder.tsx → apps/web/src/data/floorplan.ts
- `ActiveFloor()` --calls--> `floorName()`  [EXTRACTED]
  apps/web/src/components/map/BuildingScene.tsx → apps/web/src/data/floorplan.ts

## Import Cycles
- None detected.

## Communities (47 total, 26 thin omitted)

### Community 0 - "floorplan.ts"
Cohesion: 0.09
Nodes (29): ALL_PLACES, readDeepLink(), searchLocation(), cache, CellKind, CORRIDOR_XS, Entrance, entrancePlaces() (+21 more)

### Community 1 - "BuildingScene.tsx"
Cohesion: 0.08
Nodes (45): MapBadge(), ActiveFloor(), BuildingScene(), FloorMarkers(), GhostFloor(), Props, Stairs(), CampusScene() (+37 more)

### Community 2 - "Wayfinder.tsx"
Cohesion: 0.12
Nodes (18): AppShellFallback(), MapLoading(), RestroomIcon(), FloorTools(), LocationField, Tool, TOOLS, Header() (+10 more)

### Community 3 - "Panels.tsx"
Cohesion: 0.11
Nodes (22): BuildingHeader(), EventFilter, EventList(), eventPlaceId(), eventWhere(), FloorDirectory(), Persona, SearchBox() (+14 more)

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowJs, incremental, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (38): dependencies, lucide-react, next, react, react-dom, @react-three/drei, @react-three/fiber, three (+30 more)

### Community 6 - "scripts"
Cohesion: 0.08
Nodes (23): concurrently, devDependencies, concurrently, @types/node, typescript, engines, node, name (+15 more)

### Community 7 - "api/package.json"
Cohesion: 0.10
Nodes (19): dependencies, express, @trojan-compass/shared, devDependencies, tsx, @types/express, @trojan-compass/shared, name (+11 more)

### Community 8 - "route.ts"
Cohesion: 0.16
Nodes (13): Building, Floor, Position3D, ChatMessage, NavigationIntent, CampusEvent, Place, PlaceKind (+5 more)

### Community 9 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, lib, module, moduleResolution, outDir, rootDir, sourceMap, types (+9 more)

### Community 10 - "demo.js"
Cohesion: 0.13
Nodes (22): buildingTooltip, init(), showResults(), label, map, menu, notify(), openPlace() (+14 more)

### Community 12 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, lib, module, moduleResolution, noEmit, types, extends, include (+3 more)

### Community 13 - "shared/package.json"
Cohesion: 0.22
Nodes (8): exports, name, private, scripts, build, typecheck, type, version

### Community 14 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, noUncheckedIndexedAccess, resolveJsonModule, skipLibCheck, strict, target

### Community 15 - "Trojan Compass architecture"
Cohesion: 0.29
Nodes (6): Current boundary, Feature flow, Goal, Responsibilities, Suggested implementation order, Trojan Compass architecture

### Community 16 - "server.ts"
Cohesion: 0.47
Nodes (3): app, env, port

### Community 17 - "layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, sans, serif, viewport

### Community 18 - "Trojan Compass"
Cohesion: 0.29
Nodes (6): Get started, Stack, Structure, Trojan Compass, Two-site campus demo, UI development

### Community 45 - "routing.ts"
Cohesion: 0.11
Nodes (27): MODES, Props, RouteSteps(), STEP_ICONS, Props, accessibleEntrancePlace(), entrancePlace(), isStepFreeEntrance() (+19 more)

### Community 46 - "campus-demo/package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, dev, test, type, version

## Knowledge Gaps
- **175 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+170 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 255 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getLevels()` connect `BuildingScene.tsx` to `floorplan.ts`, `Wayfinder.tsx`, `Panels.tsx`, `routing.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `BuildingCode` connect `BuildingScene.tsx` to `floorplan.ts`, `Wayfinder.tsx`, `Panels.tsx`, `routing.ts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `floorName()` connect `Wayfinder.tsx` to `floorplan.ts`, `BuildingScene.tsx`, `Panels.tsx`, `routing.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _175 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `floorplan.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08522727272727272 - nodes in this community are weakly interconnected._
- **Should `BuildingScene.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07836538461538461 - nodes in this community are weakly interconnected._
- **Should `Wayfinder.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._