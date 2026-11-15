# Trojan Compass — Swift app with the original web UI

The default Swift app now bundles the **actual website screens and assets** from
`trojan-compass-main (1).zip` (reference commit
`c04a38a332bcdd89cc0d8c5d0624c628a1750b07`). It reproduces the original USC logo,
campus map tiles/footprints, fonts, sidebar, menus, search, interior viewer, floor
and layer controls, Directions/Chat panels, and updated Trojan guide/dances.
The earlier Apple Maps screen and native bottom toolbar are no longer the default.
Submitting a successful room/building search closes the Search panel and restores
the full map, with the result highlighted. An unsuccessful search stays open with
its error and query; reopening Search retains the previous query.

## Run

1. Install and open Xcode, including an iOS simulator runtime.
2. Open **`mobile/TrojanCompass.xcodeproj`**, select **TrojanCompass**, and choose an
   iPhone simulator.
3. Press **⌘R**. No npm command or running backend is required for the bundled UI.

The macOS preview uses a **393 × 852** content area. The iOS app adapts to the real
device screen and retains the website's existing responsive layouts. For a phone,
select your Apple development Team under Signing & Capabilities, use a unique
bundle identifier if necessary, connect/trust the device, and run. Signing
credentials are not committed.

## What is replicated

Swift hosts the original campus HTML/CSS/assets and the original React interior
components in WKWebView. The app serves these from its bundle using a private
`compass-web://bundle/` origin. It does not depend on a server running on the phone
or Mac. The original `localhost:3000`/`3001` navigation intents are intercepted and
mapped to the corresponding bundled interior/campus screen.

All user-visible branding/layout remains in the original web source. Packaging
adapts Next.js-only loading/image components, bundles the existing Google fonts,
and embeds the directory, GLB model, and dance clips for local loading. It retains
source credits and font licenses. External official links open the system browser;
they are not silently replaced with fabricated content.
Source Sans/Serif are bundled; the saved campus stylesheet also retains its original
provider font URLs, which use system-font fallbacks when offline.

As on the website, campus interiors are a local demonstration, Chat explicitly
uses demo replies, Directions submission reports that routing is coming soon,
and unsupported campus categories/services show their existing notices or link to
official resources. Copying the UI does not deploy a real routing or AI service.

## Rebuild after web changes

From the repository root:

```sh
npm ci
npm run build:mobile-replica
node scripts/check-mobile-replica.mjs
```

The generated UI is checked in under `TrojanCompass/Resources/Replica/`, so Xcode
can build it without Node. `mobile/Replica/build.mjs` documents the small transport
adaptations. `Resources/Replica/source.json` records source provenance. The original
web component updates and guide asset sources from the ZIP are included in this
branch, with their regression tests and attribution.

To view the web reference locally, run `npm run dev:demo` (campus port **3001**,
interiors port **3000**). Those servers are only for comparing/developing the web UI.

## Retained native integration work

The Foundation API models/client, contract/fixtures, Swift state management, and
previous native screens remain available for backend integration development.
Launching with the `--native-integration` argument selects that experimental shell;
it is not the default web-replica UI. The shared server still needs to implement
the proposed APIs before live search/scene/routing/chat integration can be verified.

Shared checks can run with `scripts/check-mobile.sh`, or `swift test --package-path
mobile` on a healthy Swift/Xcode installation. The current machine's Command Line
Tools have a module-cache/runtime mismatch, so direct compiler checks were used.

## Device verification

The complete source has been compiled and the bundled campus/interior UI exercised
in a native macOS preview. Xcode, an iOS SDK, and a simulator are not installed on
the development machine. iPhone compilation, signing, real touch gestures, keyboard,
VoiceOver, safe areas, memory, and frame rate still require Xcode/device checks.
See `VALIDATION.md` for the checks actually completed.
