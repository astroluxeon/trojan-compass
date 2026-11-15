# Validation — November 14, 2026

The development machine has Swift 6.2.3 Command Line Tools and macOS SDKs, but no
Xcode application, iOS SDK, or simulator runtime. No iPhone simulator/device build
or signing result is claimed.

## Passed

- Compiled the complete shared SwiftUI app, models, state, transport, and WebKit
  adapter into a native macOS preview executable using Swift 5 language mode.
- Decoded all **46 positive handoff fixtures**, including unknown-action handling
  and explicit-null chat-context encoding.
- Passed **21 standalone state/transport checks**: all nine interiors; LAW room
  query variants; Medicine Crow/VKC alias; Michelson exclusion; floor selection;
  endpoint retention/cancel/edit; explicit preview service failures; accessibility
  filtering/preference behavior; missing interior preservation; unverified-route
  rejection; basement links; layer defaults; ETag/304 reuse; structured HTTP errors;
  invalid path rejection; route retention when Directions closes.
- Bundled the offline viewer and embedded Trojan GLB successfully.
- Type-checked the embedded viewer TypeScript and its imported web components.
- Ran the existing web regression suite: **26 passed, 0 failed**.
- Parsed/linted the iOS Info.plist and Xcode project with `plutil`.

## Native interactive checks

Launched the macOS preview built from the same SwiftUI sources and verified:

- Campus map opens with tools closed and markers for all nine supported interiors.
- Search for `LAW 101` returns the right room, keeps Search open after selection,
  and highlights room 101 gold in the embedded viewer.
- Selecting a room in the web scene updates the native room detail card.
- Clicking another floor updates the native floor control and clears the stale
  room selection. Returning to the first floor works.
- Native Layers matches the handoff's ordering/defaults. With Classrooms off,
  the selected room's gold highlight and label remain visible.
- The file-bundled scene loads in WKWebView without a web server or remote model
  fetch. A browser check also loaded the generated viewer and its room labels.

## Local toolchain workaround

The installed Command Line Tools include two conflicting `SwiftBridging` module
maps. For direct Swift compiler verification, a temporary VFS overlay in the chat's
`work/` directory hides the obsolete duplicate **for those compiler invocations
only**. No system file or toolchain setting was changed. SwiftPM additionally hits
a local PackageDescription module/runtime mismatch, so `swift test` was not used
as evidence; the independent fixture/state runners and direct full-app compilation
were used instead. The overlay is a local verification aid and is not needed by
the checked-in Xcode project on a normal Xcode installation.

## Still requires Xcode/backend/device verification

- iOS compilation, simulator launch, phone/iPad layout and signing.
- Physical-device frame rate/memory, carry/drop touch gestures, keyboard/sheet
  behavior, VoiceOver, Dynamic Type, reduced motion, and background transitions.
- End-to-end live scene/search/routing/chat against a backend implementing
  `contract.openapi.json`. The repository's health-only backend cannot prove these.
- Accessibility claims and actual campus data accuracy; preview/fixture data
  remain unverified.

The Xcode project and guide are ready for the first iOS run; these remaining checks
must not be represented as completed acceptance tests.
