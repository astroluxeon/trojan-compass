import Foundation

// Native decoding seam for a future native control layer. The WKWebView implementation
// intentionally delegates requests and action execution to the web client.
enum JSONValue: Decodable {
    case object([String: JSONValue]), array([JSONValue]), string(String), number(Double), bool(Bool), null
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let v = try? c.decode(Bool.self) { self = .bool(v) }
        else if let v = try? c.decode(Double.self) { self = .number(v) }
        else if let v = try? c.decode(String.self) { self = .string(v) }
        else if let v = try? c.decode([String: JSONValue].self) { self = .object(v) }
        else { self = .array(try c.decode([JSONValue].self)) }
    }
}
struct Vector3: Decodable { let x: Double; let y: Double; let z: Double }
struct Place: Decodable { let id: String; let buildingId: String; let floorId: String; let displayLabel: String; let position: Vector3; let sceneObjectKey: String? }
struct DatasetEnvelope<Item: Decodable>: Decodable { let requestId: String; let dataVersion: String; let items: [Item]; let nextCursor: String? }
struct BuildingSummary: Decodable { let id: String; let code: String; let name: String; let capabilities: [String: Bool] }
struct PlaceSearchResult: Decodable { let place: Place; let matchLabel: String; let secondaryLabel: String }
struct FloorResponse: Decodable { let requestId: String; let dataVersion: String; let floor: Floor; let geometry: JSONValue?; let places: [Place] }
struct Floor: Decodable { let id: String; let buildingId: String; let label: String; let sortOrder: Int; let elevationMeters: Double; let sceneObjectKey: String }
struct SceneResponse: Decodable { let requestId: String; let dataVersion: String; let scene: JSONValue }
struct ResolvedEndpoint: Decodable { let buildingId: String; let floorId: String; let placeId: String?; let nodeId: String; let position: Vector3; let snapDistanceMeters: Double }
struct RouteLeg: Decodable {
    let kind: String
    let id: String
    let points: JSONValue
    var isSupported: Bool { ["indoor", "vertical", "outdoor"].contains(kind) }
}
struct RouteStep: Decodable { let id: String; let index: Int; let kind: String; let text: String; let legId: String; let pointIndex: Int; let buildingId: String?; let floorId: String? }
struct Route: Decodable {
    let id: String; let origin: ResolvedEndpoint; let destination: ResolvedEndpoint
    let distanceMeters: Double; let durationSeconds: Double; let legs: [RouteLeg]; let steps: [RouteStep]
    var hasOnlySupportedLegs: Bool { !legs.isEmpty && legs.allSatisfy(\.isSupported) }
}
struct RouteResponse: Decodable { let requestId: String; let clientRequestId: String; let dataVersion: String; let route: Route }
struct MapAction: Decodable {
    let type: String
    let buildingId: String?; let floorId: String?; let placeId: String?; let route: Route?
    var isSupported: Bool {
        switch type {
        case "focus_building": return buildingId != nil
        case "focus_floor": return buildingId != nil && floorId != nil
        case "focus_place": return buildingId != nil && floorId != nil && placeId != nil
        case "show_route": return route?.hasOnlySupportedLegs == true
        default: return false
        }
    }
}
struct ChatResponse: Decodable {
    let requestId: String; let clientRequestId: String; let dataVersion: String; let status: String; let message: String; let actions: [MapAction]
    var canApplyActions: Bool { status == "resolved" && !actions.isEmpty && actions.allSatisfy(\.isSupported) }
}
struct APIError: Decodable {
    struct Detail: Decodable { let code: String; let message: String; let requestId: String }
    let error: Detail
}
