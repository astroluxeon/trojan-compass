# Canonical dataset snapshots — teammate-owned

No verified USC publication is bundled. The existing development records are adapted from `server/src/infrastructure/datasets/prototype/`; they are explicitly illustrative and do not enable canonical routes.

The reference loader accepts a normalized export:

```text
DATASET_ROOT/
  current.json
  version-a/dataset.json
```

`current.json` contains `{"currentVersion":"version-a","availableVersions":["version-a"]}`. A bundle has `dataVersion`, `buildings`, `places`, `scenes`, `floorGeometry`, and `navigation` arrays, as defined in `snapshot-store.ts`.

The planned separate authoring files (building/floors/places, scene, geometry, and navigation topology/walkable areas/barriers/connectors) can remain in their current organization. Export them into this normalized bundle or supply another DatasetPort adapter. Runtime graphs/caches never overwrite source navigation data.

Validate a completed export with `npm run validate:data --workspace=@trojan-compass/api -- /absolute/path/to/snapshots`. Production additionally requires reviewed, non-demo building/navigation provenance. Finish a new version before atomically updating the pointer; restart/roll replicas with a compatible retained-version set. Do not overwrite a published version.

`server/tests/support/fixture.ts` is a complete synthetic topology example for development/testing only. Shared wire fixtures also remain synthetic. Neither is verified USC access data. See `docs/backend-guide.md` for field-level navigation ownership, calibration, publication limits, and mobile integration.
