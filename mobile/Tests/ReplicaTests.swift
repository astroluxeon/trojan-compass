import XCTest
@testable import TrojanCompass

final class ReplicaTests: XCTestCase {
    @MainActor
    func testLocalWebLinksUseBundledScreens() throws {
        let campus = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "http://localhost:3001")!))
        XCTAssertEqual(campus.absoluteString, "compass-web://bundle/campus/index.html")
        let interior = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "http://localhost:3000/?building=LAW&floor=1&room=LAW-101")!))
        XCTAssertEqual(interior.host, "bundle")
        XCTAssertEqual(interior.path, "/interior/index.html")
        XCTAssertEqual(URLComponents(url: interior, resolvingAgainstBaseURL: false)?.queryItems?.first { $0.name == "room" }?.value, "LAW-101")
        XCTAssertNil(ReplicaController.bundledURL(for: URL(string: "https://example.com/map")!))
        XCTAssertNil(ReplicaController.bundledURL(for: URL(string: "http://localhost:9999")!))
    }
    @MainActor
    func testSharedCampusLink() throws {
        let url = try XCTUnwrap(ReplicaController.bundledURL(for: URL(string: "trojancompass://map?campus=1")!))
        XCTAssertEqual(url.path, "/campus/index.html")
        XCTAssertNil(url.query)
    }
}
