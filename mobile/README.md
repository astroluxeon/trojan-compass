# Trojan Compass iPhone client

Open `TrojanCompass.xcodeproj` on macOS with Xcode. The initial client uses SwiftUI and WKWebView to reuse the API-backed Three.js viewer, search, directions and chat. The embedded viewer owns requests, selected place, current origin and route state. Native code does not send duplicate requests or calculate paths.

## Development

1. Start the root web/API development servers.
2. Set the target build setting `COMPASS_VIEWER_URL` to the viewer origin reachable from your simulator or iPhone. Debug defaults to `http://localhost:3000` for a server running on the Mac. A physical phone's localhost is the phone, not your Windows/Mac computer.
3. Configure web API_BASE_URL and server PUBLIC_API_BASE_URL/VIEWER_BASE_URL for that environment. When using LAN development, bind the backend appropriately and use reachable addresses.
4. Select your signing team and run on an iPhone simulator/device. No signing identity is stored in this repository.

Debug alone permits HTTP web content for local development and provides a local-network description. Release uses the stricter Info.plist and requires an explicitly configured HTTPS viewer URL. Minimum iOS is 16. The module remains outside npm workspaces.

## Shared fixture decoding

ContractModels.swift supplies native decoding seams and rejects unsupported action execution. It intentionally decodes the fields consumed by the initial mobile integration and safely ignores additional response fields. The current embedded implementation uses the web models for live requests.

On a Mac with Swift:

```sh
swiftc mobile/TrojanCompass/ContractModels.swift mobile/tests/DecodeFixtures.swift -o /tmp/compass-fixtures
/tmp/compass-fixtures shared/fixtures/examples
xcodebuild -project mobile/TrojanCompass.xcodeproj -scheme TrojanCompass -sdk iphonesimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

Verify LAW loading, LAW 101 highlighting, LAW 101 to LAW 107 routing, floor transitions, chat actions, clarification, unavailable step-free routes, request failure preservation and pinch/orbit on the actual mobile viewer. Native iOS compilation and device behavior have not been verified on this Windows machine.
