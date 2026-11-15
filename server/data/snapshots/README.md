# Dataset snapshots

current.json points to the active immutable dataVersion. Each version has a manifest and per-building records, floors, places, scene, geometry, calibration and navigation source files. Dataset loading resolves relative to the server module or an explicit DATASET_ROOT, independently of the working directory.

The initial usc-demo-2026-11-14 snapshot is retained as a baseline. The active usc-interiors-2026-11-14 snapshot incorporates the concurrently supplied reconstruction sources. LAW remains traced; other interior positions and circulation are inferred. All access evidence is unverified. Source graph links are not evidence of surveyed routes. The routing service derives and validates adjacency in memory, rejecting obstructed segments and unsupported access.

Use npm run data:extract to reproduce the currently selected export version before release. For subsequent releases, extend the export process to a new version and update current.json only after validation. Never overwrite a released version or put derived graph caches under canonical navigation/ files.

The active snapshot contains all nine supported buildings and 46 floors (41 reconstructed plus five LAW floors). Building source definitions live in server/src/infrastructure/datasets/prototype/, with the eight reconstructions in interiors/. Evidence inputs and historical geometry review images are under docs/interiors/. Extraction also generates web/src/features/map/data/campus-models.json for the schematic overview. Reconstructed wall boxes stay inside cell bounds so wall thickness does not obstruct boundary-aligned source corridors.
