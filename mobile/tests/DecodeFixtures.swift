import Foundation

@main
enum DecodeFixtures {
    static func main() throws {
        guard CommandLine.arguments.count == 2 else { fatalError("Pass shared/fixtures/examples") }
        let directory = URL(fileURLWithPath: CommandLine.arguments[1])
        let decoder = JSONDecoder()
        func decode<T: Decodable>(_ type: T.Type, _ file: String) throws -> T {
            try decoder.decode(type, from: Data(contentsOf: directory.appendingPathComponent(file)))
        }
        _ = try decode(DatasetEnvelope<BuildingSummary>.self, "buildings.json")
        _ = try decode(DatasetEnvelope<PlaceSearchResult>.self, "search-places.json")
        _ = try decode(FloorResponse.self, "floor-1.json")
        _ = try decode(SceneResponse.self, "scene-procedural.json")
        _ = try decode(SceneResponse.self, "scene-model-usdz.json")
        for file in ["route-success.json", "route-cross-floor.json", "route-same-place.json"] {
            let response = try decode(RouteResponse.self, file)
            precondition(response.route.hasOnlySupportedLegs)
        }
        for file in ["chat-focus-place.json", "chat-focus-floor.json", "chat-focus-building.json", "chat-route.json"] {
            let response = try decode(ChatResponse.self, file)
            precondition(response.canApplyActions)
        }
        let clarification = try decode(ChatResponse.self, "chat-clarification.json")
        precondition(!clarification.canApplyActions)
        _ = try decode(APIError.self, "error-422.json")
        print("Swift fixture decoding passed")
    }
}
