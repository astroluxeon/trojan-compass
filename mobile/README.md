# Mobile — teammate placeholder

Reserved for the mobile teammate's Swift application. No Xcode project or Swift implementation is generated here, so the teammate can merge their own structure.

Both clients will use the same Express server. Start integration from:

- `../shared/contracts/openapi.yaml`: agreed HTTP contract (server URL already ends in `/api`).
- `../shared/fixtures/examples/`: synthetic response fixtures for parallel UI work.
- `../docs/ownership.md`: team boundaries.
- `../docs/architecture.md`: implemented behavior versus planned backend work.

The SwiftUI structure and embedded versus native viewer are the mobile teammate's choice. Preserve IDs, `dataVersion`, coordinate units, and structured map actions. Swift defines its own decoding models; TypeScript types are not a mobile dependency.

Only `GET /api/health` is implemented today. Building/scene reads, search, route and chat APIs are still planned. Fixtures are not live building data, and model URLs in fixtures do not imply available assets. Existing web geometry uses prototype scene units; the canonical API uses building-local meters with Y up.
