# Server composition

Eddie owns service composition and router mounting in `../app.ts`.
Inject the dataset, search, routing, and chat interfaces from `../ports/service-ports.ts` as their implementations arrive.
Only health is mounted today. Keep provider credentials and runtime validation in the server.
