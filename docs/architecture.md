# Trojan Compass architecture

## Current scope

Trojan Compass is a local campus-map demo. The campus directory runs on port
3001; nine supported buildings open an interactive interior viewer on port 3000.
The viewer uses generated floor geometry, a traced LAW plan, and an animated
Trojan guide. Room data, routes, and accessibility details are demo data, not
verified campus directions.

## Responsibilities

| Location | Responsibility |
| --- | --- |
| `apps/campus-demo` | Saved campus map, local directory, footprints, and links to interiors |
| `apps/web/src/app` | Next.js pages and shared layout |
| `apps/web/src/components/Wayfinder.tsx` | Building, floor, room, current-location, and route state |
| `apps/web/src/components/ui/FloorTools.tsx` | Search, Directions inputs, accessibility preference, and demo chat |
| `apps/web/src/components/ui/LocationAutocomplete.tsx` | Keyboard and pointer autocomplete |
| `apps/web/src/components/ui/MapOverlays.tsx` | Map layers, floor selector, breadcrumbs, and route step controls |
| `apps/web/src/components/map` | React Three Fiber scenes, labels, pins, guide placement, and animation |
| `apps/web/src/data` | Building metadata, floor geometry, room IDs, entrances, and corridors |
| `apps/web/src/lib/location-search.ts` | Building and room suggestions, including step-free filtering |
| `apps/web/src/lib/map-location.ts` | Typed-code resolution and snapping map selections to locations |
| `apps/web/src/lib/map-link.ts` | Saved-link parsing and initial map state |
| `apps/web/src/lib/map-camera.ts` | Camera framing and room-facing angles |
| `apps/web/src/lib/routing.ts` | Client-side demo graph, pathfinding, directions, and step-free checks |
| `apps/web/public/models` | Generated guide model and preview |
| `scripts/build-tommy.py` | Blender model generation |
| `apps/api/src/app.ts` | Express health endpoint; other requests return 404 |
| `packages/shared` | Type-only contracts reserved for the future API |

`apps/web/src/features`, the API feature modules, and the top-level `data`
directories remain scaffolds. They do not power the current viewer.

## Current flow

1. The campus directory links to a supported building code. The interior viewer
   reads the building, floor, room, or route from the URL.
2. Search resolves a local building or room code. The viewer highlights the room
   and its walls; All floors mode preserves the floor stack.
3. Directions accepts typed locations or map selections. A resolved current
   location places the guide on its floor; another floor shows a pin instead.
   Closing Directions or switching tabs clears the current location.
4. Autocomplete reads the same local place data as the viewer. Accessibility
   filters suggestions through a step-free entrance and an elevator-only route.
   It selects Elevators and disables Stairs in the Directions panel.
5. The route engine builds demo routes from saved route links. A route whose
   endpoints are the same place opens that floor with an arrival step.

The Directions submit button remains a preview and does not calculate a route
from its inputs. Chat uses canned replies. Events have no connected feed.

## API boundary

The frontend does not currently fetch building or route data from Express.
Next.js rewrites `/api/*` to `API_BASE_URL`, which defaults to port 4000; only
`GET /api/health` is implemented. There is no database, authentication, AI
provider, or upload pipeline.

When adding API features, keep credentials on the server and validate requests
at the endpoint. Shared contracts have no runtime exports; use `import type`.
