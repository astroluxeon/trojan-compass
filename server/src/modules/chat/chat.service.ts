import type {
  BuildingSummary,
  Candidate,
  ChatResponse,
  ChatTextRequest,
  LocationRef,
  MapAction,
  Place,
} from "@trojan-compass/shared/api";
import type {
  ChatDependencies,
  ChatPort,
  RequestScope,
} from "../../ports/service-ports.js";
import type {
  IntentAdapter,
  NavigationIntent,
} from "../../integrations/ai/intent.js";
import { validateIntent } from "../../integrations/ai/intent.js";
import { assertContract, validateBody } from "../../lib/contracts.js";
import { AppError, invalid } from "../../lib/errors.js";
import { checkScope } from "../../lib/scope.js";
import { normalize } from "../search/search.service.js";

const placeCandidate = (p: Place): Candidate => ({
  kind: "place",
  label: p.displayLabel,
  location: { kind: "place", buildingId: p.buildingId, placeId: p.id },
});
const buildingCandidate = (b: BuildingSummary): Candidate => ({
  kind: "building",
  label: `${b.code} — ${b.name}`,
  buildingId: b.id,
});
const location = (p: Place): LocationRef => ({
  kind: "place",
  buildingId: p.buildingId,
  placeId: p.id,
});

export class ChatService implements ChatPort {
  constructor(
    private readonly dependencies: ChatDependencies,
    private readonly intentAdapter: IntentAdapter,
  ) {}
  async respond(
    scope: RequestScope,
    request: ChatTextRequest,
  ): Promise<ChatResponse> {
    validateBody("ChatTextRequest", request);
    checkScope(scope);
    if (typeof request.message !== "string" || !request.message.trim())
      throw invalid("A nonempty message is required.", "message");
    if (request.dataVersion !== scope.dataVersion)
      throw new AppError(
        "DATA_VERSION_MISMATCH",
        409,
        "Chat and request data versions differ.",
      );
    if (request.preferences.stepFree && request.preferences.mode === "stairs")
      throw invalid(
        "Step-free preferences cannot require stairs.",
        "preferences.mode",
      );
    await this.dependencies.datasets.assertSnapshot(scope);
    await this.validateContext(scope, request);
    const intent = validateIntent(
      await this.intentAdapter.interpret(scope, request),
    );
    const response = (
      status: ChatResponse["status"],
      message: string,
      actions: MapAction[] = [],
      clarification: ChatResponse["clarification"] = null,
    ): ChatResponse => ({
      requestId: scope.requestId,
      clientRequestId: request.clientRequestId,
      dataVersion: scope.dataVersion,
      status,
      message,
      actions,
      clarification,
      citations: [],
    });
    const clarify = (
      reason: NonNullable<ChatResponse["clarification"]>["reason"],
      question: string,
      candidates: Candidate[] = [],
    ) =>
      response("needs_clarification", question, [], {
        reason,
        question,
        candidates,
      });
    const building = async (
      query: string,
    ): Promise<BuildingSummary | ChatResponse> => {
      const result = await this.dependencies.search.searchBuildings(scope, {
        query,
        limit: 10,
      });
      const exact = result.buildings.filter((b) =>
        [b.id, b.code, b.name, ...b.aliases].some(
          (s) => normalize(s) === normalize(query),
        ),
      );
      const candidates = exact.length ? exact : result.buildings;
      if (candidates.length === 1 && !result.nextCursor) return candidates[0]!;
      if (exact.length === 1) return exact[0]!;
      return candidates.length
        ? clarify(
            "ambiguous_building",
            "Which building do you mean?",
            candidates.map(buildingCandidate),
          )
        : response(
            "not_found",
            "I could not find that building in this dataset.",
          );
    };
    const scopedBuilding = async (
      useHint = true,
    ): Promise<string | ChatResponse | undefined> => {
      if (useHint && intent.buildingHint) {
        const b = await building(intent.buildingHint);
        return "status" in b ? b : b.id;
      }
      return request.context.buildingId ?? undefined;
    };
    const place = async (
      query: string,
      selectedReference = false,
      role: "origin" | "destination" = "destination",
    ): Promise<Place | ChatResponse> => {
      if (selectedReference && request.context.selectedPlace)
        return this.dependencies.datasets.getPlace(
          scope,
          request.context.selectedPlace.buildingId,
          request.context.selectedPlace.placeId,
        );
      if (selectedReference)
        return clarify(
          "ambiguous_destination",
          "Select a location or name the room you mean.",
        );
      let buildingId = await scopedBuilding(role === "destination");
      if (buildingId && typeof buildingId !== "string") return buildingId;
      // An explicit code in this turn overrides stale viewport context.
      const directory = await this.dependencies.datasets.listBuildings(scope);
      const explicit = directory.filter((b) =>
        normalize(query)
          .split(" ")
          .some(
            (token) =>
              token === normalize(b.code) ||
              (token.startsWith(normalize(b.code)) &&
                /^\d/.test(token.slice(normalize(b.code).length))),
          ),
      );
      if (explicit.length === 1) buildingId = explicit[0]!.id;
      if (/^(outside|outdoors|entrance|the entrance)$/i.test(query.trim())) {
        if (!buildingId)
          return clarify(
            "ambiguous_outside",
            "Which building entrance do you mean?",
          );
        const entrances = await this.dependencies.search.searchPlaces(scope, {
          query: "",
          buildingId,
          kind: "entrance",
          limit: 10,
        });
        return clarify(
          "ambiguous_outside",
          "Choose the specific entrance.",
          entrances.results.map((r) => placeCandidate(r.place)),
        );
      }
      const result = await this.dependencies.search.searchPlaces(scope, {
        query,
        buildingId,
        limit: 10,
      });
      const exact = result.results.filter((r) => r.matchType === "exact");
      const candidates = exact.length ? exact : result.results;
      if (exact.length === 1 || (candidates.length === 1 && !result.nextCursor))
        return candidates[0]!.place;
      if (candidates.length)
        return clarify(
          "ambiguous_destination",
          "Which location do you mean?",
          candidates.map((r) => placeCandidate(r.place)),
        );
      return response(
        "not_found",
        "I could not find that location in this dataset. Try a building code and room number.",
      );
    };
    let result: ChatResponse;
    if (intent.kind === "unsupported")
      result = response(
        "unsupported",
        "I can help find USC buildings, floors, rooms, and available routes.",
      );
    else if (intent.kind === "clarify")
      result = clarify(
        "ambiguous_destination",
        intent.question ?? "Which building or room do you mean?",
      );
    else if (intent.kind === "find_building") {
      const b =
        intent.reference === "context_building" && request.context.buildingId
          ? await this.dependencies.datasets.getBuilding(
              scope,
              request.context.buildingId,
            )
          : await building(intent.query ?? "");
      result =
        "status" in b
          ? b
          : response("resolved", `Opening ${b.name}.`, [
              { type: "focus_building", buildingId: b.id },
            ]);
    } else if (intent.kind === "show_floor") {
      const buildingId = await scopedBuilding();
      if (typeof buildingId !== "string")
        result =
          buildingId ??
          clarify("ambiguous_building", "Which building should I open?");
      else {
        const b = await this.dependencies.datasets.getBuilding(
          scope,
          buildingId,
        );
        const q = normalize(intent.query ?? "").replace(/^floor\s+/, "");
        const matches = b.floors.filter(
          (f) =>
            normalize(f.id) === q ||
            normalize(f.label) === normalize(intent.query ?? "") ||
            ((q === "basement" || q === "b") && f.id === "0"),
        );
        result =
          matches.length === 1
            ? response("resolved", `Opening ${b.code}, ${matches[0]!.label}.`, [
                { type: "focus_floor", buildingId, floorId: matches[0]!.id },
              ])
            : response(
                "not_found",
                "That floor is not in this building dataset.",
              );
      }
    } else {
      const destination = await place(
        intent.query ?? "",
        intent.reference === "selected_place",
      );
      if ("status" in destination) result = destination;
      else if (intent.kind === "find_place")
        result = response("resolved", `Showing ${destination.displayLabel}.`, [
          {
            type: "focus_place",
            buildingId: destination.buildingId,
            floorId: destination.floorId,
            placeId: destination.id,
          },
        ]);
      else
        result = await this.route(
          scope,
          request,
          intent,
          destination,
          (query) => place(query, false, "origin"),
          response,
          clarify,
        );
    }
    await this.validateActions(scope, result);
    const buildingIds = new Set(
      result.actions.flatMap((action) =>
        action.type === "show_route"
          ? [
              action.route.origin.buildingId,
              action.route.destination.buildingId,
            ]
          : [action.buildingId],
      ),
    );
    for (const id of buildingIds)
      for (const source of (
        await this.dependencies.datasets.getBuilding(scope, id)
      ).sources) {
        if (
          !result.citations.some(
            (c) => c.sourceId === source.id && c.url === source.url,
          )
        )
          result.citations.push({
            sourceId: source.id,
            url: source.url,
            pageReference: source.pageReference,
          });
      }
    assertContract("ChatResponse", result);
    checkScope(scope);
    return result;
  }
  private async route(
    scope: RequestScope,
    request: ChatTextRequest,
    intent: NavigationIntent,
    destination: Place,
    resolvePlace: (query: string) => Promise<Place | ChatResponse>,
    response: (
      status: ChatResponse["status"],
      message: string,
      actions?: MapAction[],
    ) => ChatResponse,
    clarify: (
      reason: NonNullable<ChatResponse["clarification"]>["reason"],
      question: string,
      candidates?: Candidate[],
    ) => ChatResponse,
  ) {
    let origin = request.context.origin;
    if (intent.originQuery) {
      const p = await resolvePlace(intent.originQuery);
      if ("status" in p) return p;
      origin = location(p);
    }
    if (!origin)
      return clarify(
        "missing_origin",
        `Where are you starting? I found ${destination.displayLabel}.`,
      );
    const mode = intent.requestedMode ?? request.preferences.mode,
      stepFree = intent.requestedStepFree ?? request.preferences.stepFree;
    if (stepFree && mode === "stairs")
      return response(
        "unsupported",
        "A step-free route cannot require stairs. Choose an elevator route or turn off step-free routing.",
      );
    try {
      const route = await this.dependencies.routing.calculateRoute(scope, {
        clientRequestId: request.clientRequestId,
        dataVersion: scope.dataVersion,
        origin,
        destination: location(destination),
        mode,
        stepFree,
        accessProfile: "public",
      });
      return response("resolved", `Route to ${destination.displayLabel}.`, [
        { type: "show_route", route },
      ]);
    } catch (error) {
      if (error instanceof AppError && error.httpStatus === 422)
        return response("no_route", error.message);
      if (error instanceof AppError && error.code === "FEATURE_DISABLED")
        return response("unsupported", error.message);
      throw error;
    }
  }
  private async validateContext(scope: RequestScope, request: ChatTextRequest) {
    const c = request.context,
      d = this.dependencies.datasets;
    if (c.floorId && !c.buildingId)
      throw invalid("Context floor requires a building.", "context.floorId");
    if (c.buildingId) await d.getBuilding(scope, c.buildingId);
    if (c.floorId) await d.getFloor(scope, c.buildingId!, c.floorId);
    if (c.selectedPlace)
      await d.getPlace(
        scope,
        c.selectedPlace.buildingId,
        c.selectedPlace.placeId,
      );
    if (c.origin?.kind === "place")
      await d.getPlace(scope, c.origin.buildingId, c.origin.placeId);
    if (c.origin?.kind === "position")
      await d.getFloor(scope, c.origin.buildingId, c.origin.floorId);
  }
  private async validateActions(scope: RequestScope, result: ChatResponse) {
    if (result.status !== "resolved" && result.actions.length)
      throw new Error("Unresolved chat cannot contain actions");
    for (const action of result.actions) {
      if (action.type === "focus_building")
        await this.dependencies.datasets.getBuilding(scope, action.buildingId);
      if (action.type === "focus_floor")
        await this.dependencies.datasets.getFloor(
          scope,
          action.buildingId,
          action.floorId,
        );
      if (action.type === "focus_place") {
        const p = await this.dependencies.datasets.getPlace(
          scope,
          action.buildingId,
          action.placeId,
        );
        if (p.floorId !== action.floorId)
          throw new Error("Action place/floor mismatch");
      }
      if (action.type === "show_route") assertContract("Route", action.route);
    }
  }
}
