# Canonical dataset snapshots — teammate-owned, pending

The existing prototype is in `server/src/infrastructure/datasets/prototype/`. No canonical snapshot has been published by this reorganization.

The teammate will prepare validated files under:

```text
{dataVersion}/
  manifest.json
  buildings/{buildingId}/
    building.json
    floors.json
    places.json
    scene.json
    geometry/
    navigation/
      topology.json
      walkable-areas.json
      barriers.json
      connectors.json
```

The teammate owns source geometry and topology. Eddie owns derived graphs and caches, which must not overwrite source navigation files. Do not create `current.json` pointing to an incomplete snapshot. The eventual loader must resolve paths relative to its module/configuration, not the process working directory.

Preserve canonical IDs. Convert prototype scene units deliberately into building-local meters with Y up, retaining provenance and calibration. Fixture examples are not publishable datasets.
