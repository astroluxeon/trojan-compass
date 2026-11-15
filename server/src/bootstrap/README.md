# Server composition

create-services.ts creates the snapshot repository and injects it into search and routing, then injects those interfaces and the selected intent provider into chat. app.ts mounts each feature's HTTP bindings and adds request scope, schema validation, cache semantics and common errors. All service calls are in process. Eddie owns composition and cross-feature integration.
