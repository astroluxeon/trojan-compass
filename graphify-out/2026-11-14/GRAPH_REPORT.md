# Graph Report - trojan-compass  (2026-11-14)

## Corpus Check
- 102 files · ~121,705 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 740 nodes · 1197 edges · 57 communities (30 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db378010`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TommyTrojan.tsx
- Sculptor
- routing.ts
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
- Building models
- FloorSelector.tsx
- RoomHighlight.tsx
- RouteOverlay.tsx
- useBuilding.ts
- useRoute.ts
- api-client.ts
- buildings/README.md
- events/README.md
- api.md
- BuildingScene.tsx
- campus-demo/package.json
- build-tommy.py
- Expert notes: sculpting (principles and judgment, by expert)
- bx_sculpt.py
- Tested sculpting procedures (Blender 5.2.1 LTS)
- Prim
- Clay
- floorplan.ts
- form_report
- remesh_stage
- _rot
- _co_of

## God Nodes (most connected - your core abstractions)
1. `Sculptor` - 39 edges
2. `BuildingCode` - 19 edges
3. `Tested sculpting procedures (Blender 5.2.1 LTS)` - 19 edges
4. `cellCenter()` - 17 edges
5. `floorName()` - 16 edges
6. `getLevels()` - 16 edges
7. `getLayout()` - 16 edges
8. `Expert notes: sculpting (principles and judgment, by expert)` - 16 edges
9. `Prim` - 14 edges
10. `floorY()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ALL_PLACES` --calls--> `getBuildingPlaces()`  [EXTRACTED]
  apps/web/src/components/ui/PlacePicker.tsx → apps/web/src/data/floorplan.ts
- `Step` --references--> `BuildingCode`  [EXTRACTED]
  apps/web/src/lib/routing.ts → apps/web/src/data/campus.ts
- `searchLocation()` --calls--> `findRoom()`  [EXTRACTED]
  apps/web/src/components/Wayfinder.tsx → apps/web/src/data/floorplan.ts
- `ActiveFloor()` --calls--> `floorName()`  [EXTRACTED]
  apps/web/src/components/map/BuildingScene.tsx → apps/web/src/data/floorplan.ts
- `Stairs()` --calls--> `cellCenter()`  [EXTRACTED]
  apps/web/src/components/map/BuildingScene.tsx → apps/web/src/data/floorplan.ts

## Import Cycles
- None detected.

## Communities (57 total, 25 thin omitted)

### Community 0 - "TommyTrojan.tsx"
Cohesion: 0.19
Nodes (14): CurrentLocationPin(), TommyTrojanMarker(), TommyTrojanPlacement(), CARRY_ANIMATIONS, TOMMY_HEIGHT_METERS, TOMMY_MODEL_HEIGHT, TOMMY_NAPE, TommyTrojanModel() (+6 more)

### Community 1 - "Sculptor"
Cohesion: 0.06
Nodes (22): Write coordinates (and mask) back to the mesh., First hit of a ray on the surface, or None. Use to place dabs on landmarks., Put a point on the surface the way a stroke drawn in a viewport lands.…, Handy landmarks: bbox min/max and the most forward (-Y) midline point., Average a per-vertex array over the edge graph (Smooth Mask equivalent)., Apply one brush dab (plus its X mirror). Returns number of vertices moved., Dabs every spacing*radius along a polyline. Points snap to the surface:…, Move a region by `delta` (mirrored in X when symmetry is on). (+14 more)

### Community 2 - "routing.ts"
Cohesion: 0.08
Nodes (40): MODES, Props, RouteSteps(), STEP_ICONS, LocationField, Tool, TOOLS, LocationAutocomplete() (+32 more)

### Community 4 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowJs, incremental, isolatedModules, jsx, lib, module, moduleResolution (+16 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, lucide-react, next, react, react-dom, @react-three/drei, @react-three/fiber, three (+31 more)

### Community 6 - "scripts"
Cohesion: 0.08
Nodes (24): concurrently, devDependencies, concurrently, @types/node, typescript, engines, node, name (+16 more)

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

### Community 45 - "BuildingScene.tsx"
Cohesion: 0.06
Nodes (46): AppShellFallback(), MapLoading(), MapBadge(), Props, CampusScene(), Props, Props, LabelLayerContext (+38 more)

### Community 46 - "campus-demo/package.json"
Cohesion: 0.25
Nodes (7): name, private, scripts, dev, test, type, version

### Community 47 - "build-tommy.py"
Cohesion: 0.40
Nodes (9): ball(), capsule(), crest_band(), finish(), mesh(), pivot(), plate(), Build the simple Trojan map figure with Blender 4.3. Run: blender --background… (+1 more)

### Community 48 - "Expert notes: sculpting (principles and judgment, by expert)"
Cohesion: 0.05
Nodes (38): Character-level questions (after every stage, answer in one line each), Critique rubric: judge a sculpt the way the experts do, Lessons from the evaluation runs (2026-09-24) [eval], Order of looking (never skip ahead), Reporting, Stage 1: blockout (voxel about H/40), Stage 2: primary forms and landmarks (H/65 to H/100), Stage 3: secondary forms and lines (H/130 to H/235) (+30 more)

### Community 49 - "bx_sculpt.py"
Cohesion: 0.09
Nodes (20): bezier(), ellipsoid(), expert_brush(), head_guides(), long_lens_render(), bx_sculpt: sculpt-brush equivalents for an agent with no tablet. Blender's…, Perspective render through a long lens, for proportion judgment: Morren 95 mm…, Store sculpted coordinates (e.g. Sculptor.co after an expression pass) in a… (+12 more)

### Community 50 - "Tested sculpting procedures (Blender 5.2.1 LTS)"
Cohesion: 0.11
Nodes (19): Brush table (5.2 assets and their headless equivalents), P10. Face sets without sculpt operators, P11. Expression on a shape key (neutral basis), readable size, and the hand-off reprojection, P12. Headless operator matrix (Blender 5.2.1, `probe_headless_ops.py`), P13. Real brushes in a live GUI session (bx_gui + the experts' settings), P14. Explicit planes on a mesh: plane_cut, corner_cut, planarity, P15. Shading-level form check, P16. Stylized hair as clumps (separate object) (+11 more)

### Community 51 - "Prim"
Cohesion: 0.12
Nodes (14): Prim, Polynomial smooth minimum: blends two distance fields within k of their seam., A signed distance field (negative inside) with a bounding box for cheap…, self minus other (a socket, a bowl, a nostril)., self intersect other: clip by sd_halfspace for a plane cut with an edge of…, Everything behind the plane (opposite the outward normal) is inside. Use with…, Round cone (capsule with different end radii) from a (radius r1) to b (radius…, Tapered tube through a polyline (hair clump, eyebrow bar, scarf ring, neck… (+6 more)

### Community 52 - "Clay"
Cohesion: 0.20
Nodes (6): Clay, Dense signed-distance 'clay' on a regular grid: add / sub / intersect…, Global intersection (a half-space cuts the whole clay: bust base, skull side…, Snap points onto the current surface (where a brush cursor would land)., A tube laid along `points` projected onto the surface: op 'add' rises `amount`…, sd_mirror_x()

### Community 53 - "floorplan.ts"
Cohesion: 0.07
Nodes (49): ActiveFloor(), BuildingScene(), FloorMarkers(), GhostFloor(), Stairs(), CameraRig(), frame(), resolve() (+41 more)

### Community 54 - "form_report"
Cohesion: 0.17
Nodes (13): curvature_radius(), final_render(), fit_plane(), fit_sphere(), form_report(), framing(), Shading-level form check on visible surface points (from surface_samples). The…, Camera placement that fits the REAL vertices (evaluated, modifiers included) of… (+5 more)

### Community 55 - "remesh_stage"
Cohesion: 0.20
Nodes (11): drop_islands(), Mesh the zero level set (OpenVDB volume to quads), merge duplicate vertices,…, Blender's voxel remesh (Ctrl+R in sculpt mode). Merges intersecting parts.…, Join primitive masses and voxel-remesh them into one sculptable surface. relax:…, Make the mesh exactly X-symmetric (Keelan Jon symmetrizes after every remesh).…, Delete loose shells smaller than keep_ratio x the vertex count (the largest…, One resolution step of the ladder: voxel remesh, drop sealed internal shells…, remesh_stage() (+3 more)

### Community 56 - "_rot"
Cohesion: 0.33
Nodes (6): World -> local rotation for Euler XYZ degrees (Blender's convention)., Ellipsoid (approximate distance, exact surface). rot: Euler XYZ degrees., Box with half-sizes `half` and edges rounded by `rounding` (a jaw block, a…, _rot(), sd_ellipsoid(), sd_round_box()

### Community 57 - "_co_of"
Cohesion: 0.17
Nodes (13): _co_of(), _labels(), lower_face_report(), mirror_error(), profile_rhythm(), form_report on the lower face (cheek, jaw, jowl below the cheekbone) seen in…, Distance from each vertex mirrored in local X to the nearest vertex (max, mean)., Connected-component label per vertex (numpy min-propagation + pointer jumping). (+5 more)

## Knowledge Gaps
- **234 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 385 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sculptor` connect `Sculptor` to `bx_sculpt.py`, `remesh_stage`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Clay` connect `Clay` to `bx_sculpt.py`, `remesh_stage`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `Tested sculpting procedures (Blender 5.2.1 LTS)` connect `Tested sculpting procedures (Blender 5.2.1 LTS)` to `Expert notes: sculpting (principles and judgment, by expert)`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sculptor` be split into smaller, more focused modules?**
  _Cohesion score 0.05747126436781609 - nodes in this community are weakly interconnected._
- **Should `routing.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07673469387755102 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._