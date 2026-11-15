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
- Opened the original Search & tools menu and Search panel, entered `LAW 101`,
  verified original autocomplete, submitted Search rooms, and observed the
  canonical room ID in the bundled map URL while Search remained open.

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
