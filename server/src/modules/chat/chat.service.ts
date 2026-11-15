import type {
  Candidate,
  ChatResponse,
  ChatTextRequest,
  LocationRef,
  MapAction,
  Place,
  Clarification,
} from '@trojan-compass/shared';
import type { ChatDependencies, ChatPort, RequestScope } from '../../ports/service-ports.js';
import type { IntentProvider } from '../../integrations/ai/provider-adapter.js';
import { Failure, invalid } from '../../middleware/failure.js';
import { validate } from '../../infrastructure/contract.js';

type Resolution = { location?: LocationRef; buildingId?: string; clarification?: Clarification };
export class ChatService implements ChatPort {
  constructor(
    private deps: ChatDependencies,
    private provider: IntentProvider
  ) {}
  private candidate(p: Place): Candidate {
    return {
      kind: 'place',
      label: p.displayLabel,
      location: { kind: 'place', buildingId: p.buildingId, placeId: p.id },
    };
  }
  private async resolve(
    scope: RequestScope,
    text: string,
    buildingId: string | null
  ): Promise<Resolution> {
    if (/^outside(?: the building)?$/i.test(text)) {
      if (!buildingId)
        return {
          clarification: {
            reason: 'ambiguous_outside',
            question: 'Which building entrance should the route use?',
            candidates: [],
          },
        };
      const places = (await this.deps.datasets.listPlaces(scope, buildingId)).filter(
        (p) => p.kind === 'entrance' && p.access.entryAllowed !== false
      );
      if (places.length !== 1)
        return {
          clarification: {
            reason: 'ambiguous_outside',
            question: 'Choose an entrance.',
            candidates: places.map((p) => this.candidate(p)),
          },
        };
      return { location: { kind: 'place', buildingId, placeId: places[0]!.id } };
    }
    const buildings = await this.deps.search.searchBuildings(scope, { query: text, limit: 10 });
    const exact = buildings.buildings.find((b) =>
      [b.id, b.code, b.name, ...b.aliases].some((s) => s.toLowerCase() === text.toLowerCase())
    );
    if (exact) return { buildingId: exact.id };
    const places = await this.deps.search.searchPlaces(scope, { query: text, limit: 20 });
    let matches = places.results.filter((r) => r.matchType === 'exact');
    if (!matches.length) matches = places.results;
    if (matches.length === 1)
      return {
        location: {
          kind: 'place',
          buildingId: matches[0]!.place.buildingId,
          placeId: matches[0]!.place.id,
        },
      };
    if (matches.length > 1)
      return {
        clarification: {
          reason: 'ambiguous_destination',
          question: 'Which place did you mean?',
          candidates: matches.map((r) => this.candidate(r.place)),
        },
      };
    if (buildings.buildings.length === 1) return { buildingId: buildings.buildings[0]!.id };
    if (buildings.buildings.length > 1)
      return {
        clarification: {
          reason: 'ambiguous_building',
          question: 'Which building did you mean?',
          candidates: buildings.buildings.map((b) => ({
            kind: 'building',
            label: b.name,
            buildingId: b.id,
          })),
        },
      };
    return {};
  }
  async respond(scope: RequestScope, request: ChatTextRequest): Promise<ChatResponse> {
    validate<ChatTextRequest>('ChatTextRequest', request);
    if (request.dataVersion !== scope.dataVersion)
      throw new Failure('DATA_VERSION_MISMATCH', 409, 'Chat context uses another snapshot.');
    await this.deps.datasets.assertSnapshot(scope);
    if (request.preferences.stepFree && request.preferences.mode === 'stairs')
      invalid('Stairs cannot be combined with step-free routing.');
    if (request.context.buildingId)
      await this.deps.datasets.getBuilding(scope, request.context.buildingId);
    if (request.context.floorId) {
      if (!request.context.buildingId) invalid('A floor context requires a building.');
      await this.deps.datasets.getFloor(scope, request.context.buildingId, request.context.floorId);
    }
    if (request.context.selectedPlace)
      await this.deps.datasets.getPlace(
        scope,
        request.context.selectedPlace.buildingId,
        request.context.selectedPlace.placeId
      );
    const reply = (
      status: ChatResponse['status'],
      message: string,
      actions: MapAction[] = [],
      clarification: Clarification | null = null
    ) => {
      const result: ChatResponse = {
        requestId: scope.requestId,
        clientRequestId: request.clientRequestId,
        dataVersion: scope.dataVersion,
        status,
        message,
        actions,
        clarification,
        citations: [],
      };
      validate<ChatResponse>('ChatResponse', result, true);
      return result;
    };
    const intent = await this.provider.interpret(request, scope.signal);
    if (intent.kind === 'unsupported')
      return reply(
        'unsupported',
        'I can show USC buildings and places or calculate supported indoor routes.'
      );
    const target = await this.resolve(scope, intent.target, request.context.buildingId);
    if (target.clarification)
      return reply('needs_clarification', target.clarification.question, [], target.clarification);
    if (!target.location && !target.buildingId)
      return reply('not_found', 'No matching USC building or place was found.');
    if (intent.kind === 'focus') {
      if (target.location?.kind === 'place') {
        const p = await this.deps.datasets.getPlace(
          scope,
          target.location.buildingId,
          target.location.placeId
        );
        return reply('resolved', `Showing ${p.displayLabel}.`, [
          { type: 'focus_place', buildingId: p.buildingId, floorId: p.floorId, placeId: p.id },
        ]);
      }
      const id = target.buildingId!;
      if (intent.floorId) {
        await this.deps.datasets.getFloor(scope, id, intent.floorId);
        return reply('resolved', `Showing ${id}, floor ${intent.floorId}.`, [
          { type: 'focus_floor', buildingId: id, floorId: intent.floorId },
        ]);
      }
      return reply('resolved', `Showing ${id}.`, [{ type: 'focus_building', buildingId: id }]);
    }
    if (!target.location)
      return reply('needs_clarification', 'Choose a destination place or entrance.', [], {
        reason: 'ambiguous_destination',
        question: 'Which place in this building?',
        candidates: (await this.deps.datasets.listPlaces(scope, target.buildingId))
          .filter((p) => p.kind === 'entrance')
          .map((p) => this.candidate(p)),
      });
    let origin = request.context.origin;
    if (intent.origin) {
      const resolved = await this.resolve(scope, intent.origin, request.context.buildingId);
      if (resolved.clarification)
        return reply(
          'needs_clarification',
          resolved.clarification.question,
          [],
          resolved.clarification
        );
      origin = resolved.location ?? null;
      if (!origin) return reply('not_found', 'Choose a known origin place or entrance.');
    }
    if (!origin)
      return reply('needs_clarification', 'Where should the route start?', [], {
        reason: 'missing_origin',
        question: 'Choose your starting location.',
        candidates: [],
      });
    try {
      const route = await this.deps.routing.calculateRoute(scope, {
        clientRequestId: request.clientRequestId,
        dataVersion: scope.dataVersion,
        origin,
        destination: target.location,
        ...request.preferences,
      });
      return reply(
        'resolved',
        'Here is the supported indoor route. Route data is unverified and illustrative.',
        [{ type: 'show_route', route }]
      );
    } catch (error) {
      if (error instanceof Failure && error.httpStatus === 422)
        return reply('no_route', error.message);
      throw error;
    }
  }
}
