# Trojan Compass for iPhone and iPad

SwiftUI application targeting **iOS 17+**, with a native Apple Maps campus map and
the repository’s actual React Three Fiber interiors bundled into WKWebView. The
embedded scene has no runtime Node/Next.js server dependency. Search, Directions,
Compass, floor/layer selection, endpoint state, and API requests belong to Swift.

## Run in Xcode

1. Install Xcode from Apple’s Mac App Store. Open it once and install an iOS simulator runtime when prompted.
2. Open **`mobile/TrojanCompass.xcodeproj`**. Select the **TrojanCompass** scheme.
3. Choose an installed iPhone simulator in the run destination menu and press **⌘R**.
4. The app starts on the campus map with no panel open. Open Search and try **LAW**, **LAW 101**, or **THH 201**.

No terminal command, npm install, account, API key, or backend is required to run
the checked-in preview. Apple Maps basemap tiles require an internet connection;
the interior viewer, model, room directory, and other preview data are bundled.

For a physical phone, add your Apple ID in Xcode Settings → Accounts, select the
app target → Signing & Capabilities → your development Team, and choose a unique
bundle identifier if Xcode requests one. Connect and trust your iPhone, enable
Developer Mode when prompted, select the device, and run. Signing credentials are
not committed. The current bundle identifier is `edu.usc.trojancompass`.

## Preview versus connected mode

Preview provides nine interiors, geographic campus directory/footprints, search,
room selection, basement/individual/all floors, map gestures/reset, layer toggles,
sharing, and both endpoint pickers. The original faceless Trojan GLB and authored
carry animation run locally in the preview renderer. Use the location picker to
place or reposition the guide; selecting a listed room is the non-drag alternative.
LAW is a trace; the other interiors are generated. These are unverified maps.

Preview never returns fake AI replies or computes purported live directions.
Directions retains both structured endpoints, including open floor positions.
Step-free filtering deliberately returns no verified preview locations because
the preview does not establish verified accessibility.

When the backend implements the supplied contract, open the gear button and enter
its reachable **HTTPS API base URL ending in `/api`**. “Connect shared API” checks
the building directory, rather than treating a successful health check as a working
map service. Server credentials and AI provider keys stay on the server.

For the iOS simulator only, an API on this Mac can use
`http://localhost:4000/api`. A phone’s localhost refers to the phone. Use a reachable
HTTPS host for a physical device. The repository currently implements only health,
so connecting that unchanged backend will report an error and keep Preview usable.

Connected mode supports the proposed building/scene/floor/place, search, route,
and text-chat contracts. It stages matching versioned floor geometry before changing
maps. Procedural box and triangle-mesh scenes are supported; GLB/USDZ API scene
manifests fail explicitly rather than being misinterpreted. Indoor API geometry is
rendered directly in canonical meters, independently of the legacy preview scale.
GET responses use a bounded, version/filter-keyed in-memory ETag cache. Static
preview assets are shipped with the app. Offline live routing is not implemented.

`dataVersion` and `clientRequestId` protect dependent requests; stale searches and
route/chat replies are ignored. Missing/unknown accessibility is an explicit failure,
and a step-free request rejects a stair or unverified route. Chat drafts/endpoints
survive service failures; chat has explicit retry and no automatic POST retry.

## Links

The project registers `trojancompass://map`:

```
trojancompass://map?building=LAW&floor=1
trojancompass://map?building=LAW&floor=B
trojancompass://map?building=LAW&floor=all
trojancompass://map?building=LAW&room=LAW-101
trojancompass://map?from=LAW-101&to=LAW-103&mode=elevator
```

Route links require the connected routing service. Arbitrary HTTPS links are not
registered as Universal Links; the parser can consume their query intents if
explicitly opened by a future link integration. Invalid floors/rooms/modes show an
error. Share uses the custom scheme and preserves building, floor, and room intent.

## Develop and verify

The Xcode project compiles the app’s Swift files and copies `Resources/` as a folder.
The supplied handoff’s Foundation models/client and JSON fixtures are included.
`contract.openapi.json` records the proposed API 0.1.0; it does not claim deployment.
No root web/server folder migration was needed.

To regenerate only the bundled scene and preview directory after web UI changes:

```sh
npm ci
npm run build:mobile-viewer
```

`Viewer/build.mjs` imports the existing web components, embeds the Trojan model as
a data URL, and emits checked-in local JavaScript/CSS. It does not duplicate the
React implementation in Swift or download models at runtime. The bridge uses
structured JSON, main-frame validation, a protocol version, ready/ack/error events,
and `callAsyncJavaScript` arguments rather than concatenating user input into code.
Only bundled-file navigation is allowed while the message handler is installed.

On a Mac with a healthy Swift/Xcode toolchain, shared tests can also run with:

```sh
swift test --package-path mobile
```

The standalone checks can run without XCTest:

```sh
scripts/check-mobile.sh
```

The Swift package exists for macOS compile/test coverage; the iOS application entry
point is the `.xcodeproj`. The test target covers fixture decoding, identifiers,
search normalization/aliases, endpoint retention, floor state, link validation,
unavailable services, and accessibility rejection.

## Remaining device/integration checks

The shared source was compiled and exercised as a native macOS preview on a Mac
without Xcode or an iOS SDK. An iOS simulator
build, signing, physical-phone performance, VoiceOver/Dynamic Type, phone gestures,
keyboard composition, and backgrounding must be verified in Xcode. See
`VALIDATION.md` for checks actually run, with their outcomes.

Live endpoints need a backend implementing the proposed schemas and real datasets.
The connected procedural renderer currently shows a simple location marker; the
animated Trojan guide belongs to the legacy preview viewer. Model-based API scenes,
events, image uploads, indoor GPS, AR, persistent chat, verified outdoor routing data,
and offline live routing are outside this build. The native chat composer provides
a Send button and multiline input; custom hardware Enter/Shift-Enter behavior is
not yet implemented.
