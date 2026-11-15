# Applied repository migration

The structural migration started from `bfbab98`. The target repository is `astroluxeon/trojan-compass`; its demo startup fixes from `d1a0f72` are retained in the new paths. The pre-existing `next-env.d.ts` change is a Next-generated file; builds may regenerate it at its new path.

| Original | Current |
| --- | --- |
| `apps/web/` | `web/` |
| `apps/api/` | `server/` |
| `packages/shared/` | `shared/typescript/` |
| `apps/campus-demo/` | `demos/usc-map/` |
| `web/src/components/map/` | `web/src/features/map/renderer/` |
| `web/src/components/Wayfinder.tsx` | `web/src/features/map/components/Wayfinder.tsx` |
| `web/src/components/ui/FloorTools.tsx` | Map composition plus real search/routing/chat feature panels |
| `web/src/data/{campus,floorplan,law}.ts` | `server/src/infrastructure/datasets/prototype/` |
| `web/src/lib/routing.ts` | `server/src/modules/routing/prototype/routing.ts` |
| `web/src/lib/location-search.ts` | `server/src/modules/search/prototype/location-search.ts` |
| `web/src/lib/map-camera.ts` | `web/src/features/map/camera.ts` |
| `web/src/lib/map-location.ts` | `web/src/features/map/map-location.ts` |
| `web/src/lib/map-link.ts` | `web/src/features/map/map-link.ts` |
| `web/src/lib/mascot-motion.ts` | `web/src/features/map/renderer/mascot-motion.ts` |
| `server/src/lib/ai-client.ts` | `server/src/integrations/ai/provider-adapter.ts` |
| `server/src/lib/data-loader.ts` | `server/src/infrastructure/datasets/snapshot-loader.ts` |
| Empty root data directories | `server/data/snapshots/`, `server/data/events/` placeholders |

Unused map/search feature placeholders were replaced by working implementations or removed. Existing assets, campus demo, tests, and package identities are retained. The mascot GLB stays in `web/public/models/` because the working viewer serves it there; there are no building GLB exports to move yet.

## Transitional code

The five extracted server modules retain their prototype types and algorithms. Their generated browser copies preserve the current demo until API integration. Do not treat these types as the agreed HTTP contract or their geometry as calibrated meters. Run `npm run sync:legacy` after changing an extracted source; `npm run check:legacy` checks for drift.

The old prototype search uses routing for its accessibility filter. The canonical dataset repository must remain independent of both services. Visual picking stays client-side; backend position validation is still to implement.

Use the agreed API types from `@trojan-compass/shared`; initial hand-written drafts are isolated under `/legacy`. Canonical datasets, ports, HTTP validation, and API-backed clients remain assigned follow-up work. No deployed capabilities have been added beyond the existing health endpoint.

## Removing the compatibility bridge

1. Publish calibrated dataset snapshots and implement the dataset/scene services.
2. Implement canonical search and routing against the shared interfaces; validate responses.
3. Replace browser data/search/route imports with asynchronous API adapters, preserving saved-link behavior and loading/error states.
4. Confirm the viewer's highlight/route rendering and mobile decoding against the same fixture set.
5. Remove the generated copies and allowlist entries when their consumers are migrated. Keep or adapt regression tests to exercise the API-backed behavior.
