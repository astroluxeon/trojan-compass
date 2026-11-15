# API agreement

`openapi.yaml` is the agreed API source of truth. `openapi.json` is the equivalent copied serialization from the mobile/team handoff. This migration changes neither.

Only health is implemented. The remaining operations specify future integration, not deployed behavior. The OpenAPI server URL ends in `/api`; paths in the document are relative to that base.

Compile-time wire models are in `../typescript/src/generated/api-types.ts`, imported with `import type` from `@trojan-compass/shared` (or its `/api` subpath). They were copied from the agreed handoff; automated regeneration and runtime validation remain follow-up work. Earlier hand-written draft types remain accessible only through `/legacy` and are not the agreed contract.

Coordinate changes, IDs, `dataVersion`, request/response fields, and errors require agreement between the affected owners. Update YAML, its JSON equivalent, wire types, and examples together when intentionally changing the contract.
