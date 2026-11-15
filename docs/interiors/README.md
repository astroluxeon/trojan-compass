# Building interiors

All nine supported buildings are migrated into the current structure. LAW keeps
its five traced floors. The eight reconstructed interiors contain 41 floors and
672 room/amenity cells, including 137 confirmed and 361 inferred room numbers.
Every non-LAW position, boundary, door and corridor remains inferred.

## Where to edit

| Purpose | Current path |
| --- | --- |
| Traced LAW source | server/src/infrastructure/datasets/prototype/law.ts |
| Eight reconstructed sources | server/src/infrastructure/datasets/prototype/interiors/{code}.ts |
| Shared coordinates, room IDs, entrances and corridor loader | server/src/infrastructure/datasets/prototype/floorplan.ts |
| Building directory, floor metadata and footprints | server/src/infrastructure/datasets/prototype/campus.ts |
| Snapshot extraction and scene boxes | server/src/infrastructure/datasets/export-snapshot.ts |
| Active runtime models | server/data/snapshots/usc-interiors-2026-11-14/buildings/{CODE}/ |
| API geometry adapter and overview decoration | web/src/features/map/data/ |
| Interior rendering | web/src/features/map/renderer/BuildingScene.tsx |
| Runtime routes | server/src/modules/routing/routing.service.ts |
| Preserved original route behavior for regression tests | server/src/modules/routing/prototype/routing.ts |
| Saved campus links | demos/usc-map/map-data.js |

The source, scripts and runtime app have no dependency on trojan-compass-old/.
That reference copy remains intact. The initial usc-demo-2026-11-14 snapshot is
also retained; current.json selects the migrated snapshot.

## Buildings and floors

| Stable code | Building | Floors implemented | Evidence and principal uncertainty |
| --- | --- | --- | --- |
| DML | Doheny Memorial Library | B, Ground, First, Second | Library tour confirms these levels and named areas. Stack mezzanines unresolved. Internal indices remain 0, 1, 2, 3; generic 1xx–3xx IDs retained and marked inferred. |
| LVL | Leavey Library | B, 1–4 | 2023 tour confirms five levels. Seven Room Finder teaching-room numbers placed in lower level by matching the tour's seven teaching spaces; that assignment is inferred. |
| THH | Taper Hall of Humanities | B, 1–4 | Room records support B and 1–3. Floor 4 is retained from the supplied demo and is inferred. End wings hold large teaching rooms; every partition is inferred. |
| VKC / DMC | Dr. Joseph Medicine Crow Center for International and Public Affairs | B, 1–3 | Historic report confirms three stories over basement, U-shaped wings and sunken courtyard. Original generic floor 4 removed; tower is not an occupied floor. Courtyard dimensions inferred. |
| TCC | Ronald Tutor Campus Center | 1–4 | Directory and meeting-room list supply numbers/names. Basement event spaces belong to adjoining SKS. Exact floor-plate geometry and tenancy conflict at 330 unresolved. |
| SGM | Seeley G. Mudd Building | 1–10 | USC clinic directions establish an occupied tenth floor. Exactly ten modeled floors, floor-3 tower setback, basement omission and upper layouts are inferred. |
| SAL | Salvatori Computer Science Center | B, 1–3 | Historic report describes southern three-story block over basement and northern one-story volume. SAL 101 is confirmed; its north-volume position is inferred. |
| KAP | Kaprielian Hall | B, 1–4 | USC structural report supports four stories plus basement, three central elevators, classrooms below offices and basement laboratories. Detailed boundaries and elevator positions/service inferred. |

Floor-count “confirmed” means supported by the cited source, which may be historic;
it does not assert a current facilities survey. THH and SGM totals are explicitly
“inferred.” Roofs, mechanical spaces and undocumented mezzanines are not invented
as additional navigable floors. Generic room numbers are retained wherever they
do not contradict evidence, including the SAL 106 and KAP 106 event links. Removing
the unsupported VKC fourth floor intentionally invalidates its old generic rooms.
Known numbers are reserved before assigning inferred numbers; basement additions
use B-prefixed numbering. No numbered rooms collide within a building.

## Evidence and retained artifacts

- interior-assumptions.csv maps each feature to the migrated source record and
  records number, identity, position and accessibility assumptions.
- source-inventory.csv inventories the supplied tracker, download manifest,
  repository records and supplemental sources.
- inputs/ retains the original tracker and Python download manifest.
- qa/ retains static geometry review images for the eight reconstructions.
- validation.json is the historical report supplied with the old repository;
  its date, dependency and browser limitations describe that earlier run.

The new extraction preserves feature and floor evidence in API provenance,
including local source references when no external URL is available. Named floor
labels and aliases are retained, including DMC as an alias for stable VKC IDs.
Courtyards remain outside the floor slabs. No non-LAW geometry or accessibility
claim has been upgraded to surveyed or verified.

## Regeneration and verification

Run from the repository root:

```sh
# Optional: reauthor the eight explicit source specifications.
python scripts/build-interior-specs.py
# Rebuild runtime snapshots and schematic campus decoration.
npm run data:extract
# Rebuild the evidence tables without downloading source documents.
python scripts/inventory-interior-sources.py
npx tsx scripts/export-interior-assumptions.ts
# Validate data, routes, client adaptation and compilation.
npm test
npm run typecheck
npm run build
```

Choose a new dataVersion in export-snapshot.ts for future published revisions.
Do not edit released snapshots or add derived routing caches to their source
navigation directories.

The migrated tests check explicit floors and identities, evidence, containment,
non-overlap, corridor connectivity, aligned cores, courtyard exclusion, routes
to every reconstructed destination, stair/elevator routes on each floor, and all
five original LAW layout hashes. Static QA images are historical geometry plots;
they do not establish current browser verification.
