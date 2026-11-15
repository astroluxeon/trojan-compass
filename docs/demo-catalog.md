# Demo classes and club events

This is our normalized API, not a replica of an undocumented USC API. All records are synthetic, read-only fixtures. No USC sites are scraped. Course names and event ideas come from the project brief; dates, sections, descriptions and LAW room assignments are demo assumptions, not official listings or reservations.

## Demo occurrences

All dates are **November 16, 2026**, in America/Los_Angeles (UTC−08:00). Dates do not automatically advance.

| Record ID | Title | Time | Destination |
| --- | --- | --- | --- |
| demo-csci-356 | CSCI 356 | 09:30–10:50 | LAW 101, floor 1 |
| demo-writ-340 | WRIT 340 | 11:00–12:20 | LAW 201, floor 2 |
| demo-ee-354 | EE 354 | 13:00–14:20 | LAW 213, floor 2 |
| demo-buad-298 | BUAD 298 AI Essentials | 14:30–15:50 | LAW 303, floor 3 |
| demo-casa-dumplings | CASA Dumpling Making | 17:00–18:30 | LAW 103, floor 1 |
| demo-isa-food | ISA Global Food Fest | 18:00–20:00 | LAW 300, floor 3 |
| demo-ais-navratri | AIS USC Navratri | 19:00–21:00 | LAW 431, floor 4 |

CSCI 356 deliberately uses LAW instead of the SGM example. Organizer acronyms are retained as supplied. No instructor, capacity or official course-title claims are invented.

## Endpoints

Enabled by server composition only in non-production prototype mode. Canonical /api/events and /api/chat are unchanged.

| Method | URL | Result |
| --- | --- | --- |
| GET | /api/preview/catalog | List/search demo occurrences |
| GET | /api/preview/catalog/:recordId | One record in the same items envelope |
| POST | /api/preview/chat | Existing ChatTextRequest → ChatResponse with catalog retrieval and preview routes |

GET filters: optional q (maximum 4,000 characters), kind=class or event, dataVersion=prototype-v1. Unknown/repeated parameters are rejected. Empty q lists all occurrences chronologically. No pagination or relative-date filtering is needed for this bounded seven-record feed. No accounts, campus parameter, or writes.

Example: http://localhost:4000/api/preview/catalog?q=writ340&kind=class

Response:
```json
{
  "requestId": "server-generated-id",
  "dataVersion": "prototype-v1",
  "catalogVersion": "demo-catalog-v2",
  "demo": true,
  "total": 1,
  "items": [{
    "id": "demo-writ-340",
    "kind": "class",
    "title": "WRIT 340",
    "aliases": ["writ340", "writing 340"],
    "description": "WRIT 340 — illustrative Trojan Compass demo occurrence.",
    "courseCode": "WRIT 340",
    "section": "DEMO-01",
    "organizer": null,
    "startsAt": "2026-11-16T11:00:00-08:00",
    "endsAt": "2026-11-16T12:20:00-08:00",
    "timeZone": "America/Los_Angeles",
    "location": {
      "buildingId": "LAW",
      "floorId": "2",
      "placeId": "LAW-201",
      "label": "LAW 201"
    },
    "source": {
      "kind": "synthetic",
      "official": false,
      "url": null,
      "note": "Demo fixture. Time, room, section and description are invented; not an official USC listing or room reservation."
    }
  }]
}
```

Events have null courseCode/section and an organizer string. Use location.placeId for map detail/route requests. Never derive geometry from room labels. Render the demo label. Dates contain offsets and an IANA zone for display; IDs are opaque strings. Each record represents one occurrence, not a recurring course definition. Responses use Cache-Control: no-store.

Errors use the existing error envelope (code, message, requestId, optional fieldErrors). Statuses: 400 malformed filters/body; 404 unknown record or disabled endpoint; 409 wrong map version; 429 rate limit; chat also 501 unconfigured AI and 503/504 provider failure/timeout. Empty search results are 200 with items: [].

## Retrieval and AI

Student message → lexical retrieval → AI intent with retrieved reference records → validated intent → server resolves title against catalog → known map place → focus_place or preview router → show_route.

The model receives at most eight reference records. It cannot create map coordinates or route geometry. The server resolves its title query again, validates the stored place/floor IDs, and adds a [Demo] summary containing the record's time and room. Multiple occurrences require clarification; a route without a start asks for the origin. Preview routes retain illustrative-route and unverified-accessibility warnings.

This is retrieval-augmented intent generation, not training a model on the fixtures. Keyword/alias retrieval is sufficient for seven records; no vector database is added. Live extraction still requires evaluation with a configured model.

POST /api/preview/chat example:
```json
{
  "clientRequestId": "demo-navratri-1",
  "dataVersion": "prototype-v1",
  "message": "I am at LAW 101. Take me to AIS USC Navratri using elevators.",
  "history": [],
  "context": {
    "buildingId": "LAW",
    "floorId": "1",
    "selectedPlace": null,
    "origin": {"kind":"place","buildingId":"LAW","placeId":"LAW-101"}
  },
  "preferences": {"mode":"elevator","stepFree":false,"accessProfile":"public"}
}
```

A resolved route returns the existing show_route action. “Where is WRIT 340?” produces focus_place for LAW / 2 / LAW-201 plus its demo time. The model must preserve event/course titles so the server can attribute the response.

Provider configuration is unchanged: AI_PROVIDER=openai, OPENAI_API_KEY and OPENAI_MODEL. There is no fake AI fallback. Without credentials the catalog works, but preview chat returns FEATURE_DISABLED. Tests mock interpretation and do not prove live-model accuracy.

## Client handoff and remaining work

The web ChatPanel now calls /api/preview/chat. The backend retrieves from the same DemoCatalog service exposed by GET /api/preview/catalog, avoiding a redundant HTTP call back to itself. Retrieved records go to the AI interpreter; validated server actions control the viewer. The model does not fetch arbitrary URLs or invent route geometry.

The client sends the visible building/floor, selected destination, separately confirmed origin, bounded conversation history, and current Directions preferences. A selected destination is never treated as the origin. The adapter validates all actions before changing the map, accepts known prototype highlights and indoor routes, and rejects incompatible map versions or invalid references. Chat routes use the same green arrows and blue floor markers as manual Directions. Returned origins/destinations update the Directions inputs and become context for follow-ups. A route-ready card opens the instructions; clearing/editing routes cancels stale work. Context or preference changes also cancel in-flight chat requests.

Live GPT-6.1 Sol browser verification: “Show me BUAD 298 AI Essentials” highlighted LAW 303; “Take me there using elevators” asked for a start; “I am at LAW 101” drew an elevator route; “Use stairs instead” retained the endpoints and redrew the stairs route. View directions showed LAW 101 → LAW 303 and matching stairs preferences. These examples passed; they are not a comprehensive model-accuracy evaluation.

Mobile should consume the same ChatResponse actions and clarification states. The agreed production OpenAPI schema is unchanged; the preview endpoints require non-production prototype mode.

Fixtures/types: server/src/modules/catalog/demo-catalog.ts. Startup verifies map references. Bump catalogVersion when replacing fixtures. Once the actual schedule is supplied, confirm code, section, meeting dates/days, times, zone and room. Expand recurring meetings into occurrences. Preserve the original source venue separately from any intentional LAW demo relocation. Real feeds need their own adapter/provenance type; do not relabel synthetic fixtures as official. Unknown/hidden venues remain unresolved. Screenshot ingestion and real source adapters are not implemented.

Checks: npm run test --workspace @trojan-compass/api; npm run typecheck --workspace @trojan-compass/api; npm run build --workspace @trojan-compass/api.
