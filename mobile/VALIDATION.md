# Validation — November 14, 2026

## Current default: original website replica

The original web UI from the supplied `trojan-compass-main (1).zip` is now the
Swift app's default. The earlier native integration shell remains opt-in.

Passed checks:

- Compiled the complete Swift app, including the new WKWebView resource handler,
  navigation delegate, clipboard bridge, and responsive web host, into a macOS app.
- Built the standalone campus and interior bundles with the actual logo, fonts,
  map tiles, guide GLB, and all three dance clips.
- Verified the campus HTML is identical to the supplied source apart from its
  bundled script tag; checked original logo/CSS bytes, local asset/font presence,
  interior controls/model embedding, and source hash/provenance.
- Ran the supplied/current web regression suite: **28 passed, 0 failed**.
- Ran campus directory/projection checks: **2 passed, 0 failed**.
- Type-checked the embedded viewer and imported components with TypeScript.
- Linted the Xcode project and Info.plist; confirmed all app Swift sources are
  referenced and the shared scheme parses.

Native interactive checks using the bundle origin (not localhost):

- Opened the original campus map in the 393 × 852 Mac preview and compared it with
  the web reference, including the USC image logo, header, tiles, map controls,
  credits, and sidebar.
- Opened the original campus sidebar; searched `LAW`; followed the result into
  the bundled LAW interior. The app's document URL changed to
  `compass-web://bundle/interior/index.html?building=LAW&floor=1`.
- Opened Search & tools and Search, verified autocomplete, and submitted a room
  search. After the requested search-dismissal update, `LAW 205` opened Floor 2,
  retained the gold room highlight, and removed the Search panel so the map
  occupies the screen again. `LAW 99999` left the query and no-match error visible.

## Mobile bottom toolbar revision

- Reduced the interior header to 44px and the USC logo to 42px on phone widths.
- Moved Search, Chat, Directions, Floors, and Layers into a persistent bottom bar,
  with icons above labels and a custom architectural floor icon.
- Compact sheets resize the actual canvas above them; they are capped to leave
  map space. The Directions action remains pinned while its form can scroll.
- Rebuilt the checked-in Swift resources and verified the final native preview's
  signature. No Swift source or Xcode project change was needed for this UI update.
- TypeScript checks and bundle/source checks passed; web regression tests remained
  **28 passed, 0 failed**.
- Exercised Search, floor selection, and layer toggles in the native 393 × 852
  preview. `LAW 205` still closes Search and highlights the room on Floor 2.
- Checked the responsive layout at 393 × 759 and 320 × 568 in Chrome. Verified
  chat submission, Directions input persistence, accessibility mode selecting
  elevators, and unsuccessful search remaining editable. The smallest viewport
  scrolls the form while retaining the bottom bar and Directions action.
- The refreshed bundled UI was opened in the native Mac preview and a screenshot
  saved. Real iPhone keyboard/safe-area/touch checks still require Xcode/device.

## Compact mobile layout update

- Bundled the responsive interior with a 44px header, smaller USC logo, and
  Search/Chat/Directions/Floors/Layers toolbar with icons above labels.
- Native 393 × 852 preview verified compact panels, successful `LAW 205` search
  dismissal/highlight, Floor 3 selection, and emergency-exit layer toggling.
- Browser checks at 393 × 759 and 320 × 568 verified bounded panels, the pinned
  Directions action, retained location inputs, step-free mode, demo chat submission,
  and unsuccessful search staying editable. Short screens scroll inside the sheet.
- Removed the repeated title/subtitle and X from every mobile sheet, retaining
  an accessible panel name and grab handle. Visually verified the final bundled
  Chat panel in the native preview. The active toolbar button also collapses it.
- Full web TypeScript check, 28 web tests, replica build, and asset checks passed.
- These are Mac/browser checks; iPhone keyboard, touch gestures, and safe areas
  still require device verification.

## Campus mobile layout update

- Built the bundled campus UI with a slim left-aligned USC header and bottom
  Search/Filters/Campus/Share/More controls; removed mobile +/− buttons.
- Browser at 393 × 759 checked search results, building-filter off state, browsing
  buildings from Filters, Share, HSC's official-map fallback, and More actions.
- Final native 393 × 852 preview verified the clean filter layout and Campus sheet
  with UPC/HSC/Recenter; selecting UPC closed the sheet and restored the map.
- Campus directory/projection tests: **2 passed**. JavaScript syntax, bundle asset
  checks, and generated Mac preview signature verification passed.
- Added two-pointer pinch/pan handling and drag-click suppression. No automated or
  physical multi-touch test was available; verify this gesture on an iPhone.

## Campus search-bar revision

- Removed the campus tab bar in favor of one 44px search field with a small map
  options button. Copied the exact building-view USC logo and Source Sans font;
  matched its divider and Trojan Compass wordmark styling.
- Native preview verified `LAW` search opens the bundled LAW interior and that the
  building view still has Search/Chat/Directions/Floors/Layers. Returned to campus
  and checked the options sheet and collapse behavior.
- JavaScript syntax and replica asset checks passed. Confirmed the building-view
  source and generated interior bundle have no changes in this revision.

## Shared foundation checks retained from the preceding implementation

All **46 positive handoff fixtures** decoded, including unknown-action and
explicit-null context checks. **21 standalone state/transport checks** passed for
search normalization/aliases, endpoint retention, floor/route state, accessibility
rejection, service failures, ETag/304 handling, HTTP errors, and path validation.
Those Foundation models and native integration components are retained.

## Local environment limits

The Mac has Swift 6.2.3 Command Line Tools and macOS SDKs, but no Xcode, iOS SDK,
or simulator runtime. An iPhone simulator/device build or signing result is not
claimed. UI touch/keyboard behavior, VoiceOver, safe areas, Dynamic Type, reduced
motion, and performance must be verified on the selected minimum iPhone/iPad.

For compiler verification, a temporary VFS overlay under the chat's `work/`
directory hides a duplicate SwiftBridging module map for those invocations only.
No system toolchain file or setting was changed. SwiftPM also encounters a local
PackageDescription runtime mismatch; direct compiler/standalone checks are the
verification evidence rather than an uncompleted `swift test` run.

Campus source/fixture data remain unverified, and the website's routing/chat
previews remain previews. Live routing, AI, or navigation accuracy is not established
by copying the website or by these tests.
