import { randomUUID } from 'node:crypto';
import type {
  GraphNode,
  GraphEdge,
  LocationRef,
  ResolvedEndpoint,
  RouteRequest,
  Route,
  RouteLeg,
  RouteStep,
  Vector3,
} from '@trojan-compass/shared';
import type {
  DatasetPort,
  NavigationSource,
  RequestScope,
  RoutingPort,
} from '../../ports/service-ports.js';
import { Failure, invalid } from '../../middleware/failure.js';
import { validate } from '../../infrastructure/contract.js';
import { distance, obstructed, project, walkable } from './geometry.js';

type Arc = { to: string; edge: GraphEdge };
type Graph = { source: NavigationSource; nodes: Map<string, GraphNode>; adj: Map<string, Arc[]> };
export class RoutingService implements RoutingPort {
  private graphs = new Map<string, Promise<Graph>>();
  constructor(private datasets: DatasetPort) {}
  private graph(scope: RequestScope, id: string) {
    const key = JSON.stringify([scope.dataVersion, id]);
    let promise = this.graphs.get(key);
    if (!promise) {
      promise = this.build(scope, id);
      this.graphs.set(key, promise);
      promise.catch(() => this.graphs.delete(key));
    }
    return promise;
  }
  private async build(scope: RequestScope, id: string): Promise<Graph> {
    const source = await this.datasets.getNavigationSource(scope, id);
    const building = await this.datasets.getBuilding(scope, id);
    const floors = new Map(building.floors.map((f) => [f.id, f]));
    if (source.buildingId !== id || source.dataVersion !== scope.dataVersion)
      throw new Failure(
        'DATA_VERSION_MISMATCH',
        409,
        'Navigation source does not match the requested snapshot.'
      );
    const nodes = new Map<string, GraphNode>();
    const adj = new Map<string, Arc[]>();
    for (const n of source.nodes) {
      validate<GraphNode>('GraphNode', n, true);
      const floor = floors.get(n.floorId);
      if (
        nodes.has(n.id) ||
        n.buildingId !== id ||
        !floor ||
        Math.abs(n.position.y - floor.elevationMeters) > 0.35
      )
        throw new Error('Invalid navigation node');
      nodes.set(n.id, n);
      adj.set(n.id, []);
    }
    const add = (edge: GraphEdge) => {
      const a = nodes.get(edge.fromNodeId),
        b = nodes.get(edge.toNodeId);
      if (!a || !b) throw new Error('Dangling navigation edge');
      if (a.floorId === b.floorId && obstructed(a.position, b.position, a.floorId, source.barriers))
        return;
      if (a.floorId !== b.floorId && !['stairs', 'elevator', 'ramp'].includes(edge.kind))
        throw new Error('Invalid floor transition');
      adj.get(a.id)!.push({ to: b.id, edge });
      if (edge.bidirectional) adj.get(b.id)!.push({ to: a.id, edge });
    };
    for (const edge of source.edges) {
      validate<GraphEdge>('GraphEdge', edge, true);
      const a = nodes.get(edge.fromNodeId),
        b = nodes.get(edge.toNodeId);
      if (!a || !b || Math.abs(edge.lengthMeters - distance(a.position, b.position)) > 0.01)
        throw new Error('Invalid edge metrics');
      add(edge);
    }
    for (const core of source.connectors) {
      const list = core.nodeIds
        .map((n) => nodes.get(n))
        .sort(
          (a, b) =>
            (floors.get(a?.floorId ?? '')?.sortOrder ?? 0) -
            (floors.get(b?.floorId ?? '')?.sortOrder ?? 0)
        );
      if (list.some((n) => !n)) throw new Error('Invalid connector node');
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1]!,
          b = list[i]!;
        const ordered = building.floors.slice().sort((a, b) => a.sortOrder - b.sortOrder);
        if (a.floorId === b.floorId) throw new Error('Connector repeats a floor');
        if (
          core.kind === 'stairs' &&
          ordered.findIndex((f) => f.id === b.floorId) -
            ordered.findIndex((f) => f.id === a.floorId) !==
            1
        )
          continue;
        add({
          id: `${core.id}:${a.floorId}:${b.floorId}`,
          fromNodeId: a.id,
          toNodeId: b.id,
          lengthMeters: distance(a.position, b.position),
          kind: core.kind,
          bidirectional: true,
          stepFree: core.kind === 'stairs' ? 'verified_no' : 'unknown',
          accessLevel: 'public',
        });
      }
    }
    return { source, nodes, adj };
  }
  private async endpoint(
    scope: RequestScope,
    ref: LocationRef,
    graph: Graph,
    role: 'origin' | 'destination'
  ): Promise<ResolvedEndpoint> {
    const places = await this.datasets.listPlaces(scope, ref.buildingId);
    const anchor = async (placeId: string, requested: LocationRef) => {
      const p = await this.datasets.getPlace(scope, ref.buildingId, placeId);
      if (
        p.access.level !== 'public' ||
        (role === 'origin' ? p.access.exitAllowed === false : p.access.entryAllowed === false)
      )
        throw new Failure('NO_ROUTE', 422, 'This place is not eligible for a public route.');
      const access = p.accessPoints.find((a) => graph.nodes.has(a.nodeId));
      if (!access) throw new Failure('NO_ROUTE', 422, 'Place has no usable route arrival.');
      const n = graph.nodes.get(access.nodeId)!;
      if (n.floorId !== p.floorId || distance(n.position, access.position) > 0.01)
        throw new Error('Place access point does not match topology');
      return {
        requested,
        buildingId: p.buildingId,
        floorId: p.floorId,
        placeId: p.id,
        nodeId: n.id,
        position: n.position,
        snapDistanceMeters:
          requested.kind === 'position' ? distance(requested.position, n.position) : 0,
      };
    };
    if (ref.kind === 'place') return anchor(ref.placeId, ref);
    const floor = await this.datasets.getFloor(scope, ref.buildingId, ref.floorId);
    if (Math.abs(ref.position.y - floor.elevationMeters) > 0.35)
      throw new Failure('INVALID_POSITION', 422, 'Picked position has the wrong floor elevation.');
    if (obstructed(ref.position, ref.position, ref.floorId, graph.source.barriers))
      throw new Failure('INVALID_POSITION', 422, 'Picked position lies inside a barrier.');
    const room = places.find(
      (p) =>
        p.floorId === ref.floorId &&
        p.bounds &&
        ref.position.x >= p.bounds.min.x &&
        ref.position.x <= p.bounds.max.x &&
        ref.position.z >= p.bounds.min.z &&
        ref.position.z <= p.bounds.max.z
    );
    if (room) return anchor(room.id, ref);
    if (
      !walkable(ref.position, ref.floorId, graph.source) ||
      obstructed(ref.position, ref.position, ref.floorId, graph.source.barriers)
    )
      throw new Failure('INVALID_POSITION', 422, 'Choose a room or a walkable floor position.');
    const candidates = [...graph.adj.entries()]
      .flatMap(([from, arcs]) => arcs.map((arc) => ({ from, arc })))
      .filter(
        ({ from, arc }) =>
          graph.nodes.get(from)!.floorId === ref.floorId &&
          graph.nodes.get(arc.to)!.floorId === ref.floorId &&
          arc.edge.accessLevel === 'public'
      );
    const best = candidates
      .map((c) => ({
        ...c,
        position: project(
          ref.position,
          graph.nodes.get(c.from)!.position,
          graph.nodes.get(c.arc.to)!.position
        ),
      }))
      .filter(
        (c) =>
          distance(ref.position, c.position) <= 2 &&
          !obstructed(ref.position, c.position, ref.floorId, graph.source.barriers)
      )
      .sort((a, b) => distance(ref.position, a.position) - distance(ref.position, b.position))[0];
    if (!best)
      throw new Failure(
        'INVALID_POSITION',
        422,
        'No unobstructed route anchor is within 2 meters.'
      );
    const id = `picked:${randomUUID()}`;
    graph.nodes.set(id, {
      id,
      buildingId: ref.buildingId,
      floorId: ref.floorId,
      position: best.position,
      kind: 'position',
    });
    graph.adj.set(id, []);
    // Split only the selected directed edge; preserve its access and directionality.
    const edge = best.arc.edge;
    const a = edge.fromNodeId,
      b = edge.toNodeId;
    graph.adj.set(
      a,
      graph.adj.get(a)!.filter((arc) => !(arc.to === b && arc.edge.id === edge.id))
    );
    graph.adj.set(
      b,
      graph.adj.get(b)!.filter((arc) => !(arc.to === a && arc.edge.id === edge.id))
    );
    const connect = (from: string, to: string) => {
      const e = {
        ...edge,
        id: `${id}:${from}:${to}`,
        fromNodeId: from,
        toNodeId: to,
        lengthMeters: distance(graph.nodes.get(from)!.position, graph.nodes.get(to)!.position),
      };
      graph.adj.get(from)!.push({ to, edge: e });
      if (edge.bidirectional) graph.adj.get(to)!.push({ to: from, edge: e });
    };
    connect(a, id);
    connect(id, b);
    return {
      requested: ref,
      buildingId: ref.buildingId,
      floorId: ref.floorId,
      placeId: null,
      nodeId: id,
      position: best.position,
      snapDistanceMeters: distance(ref.position, best.position),
    };
  }
  async calculateRoute(scope: RequestScope, request: RouteRequest): Promise<Route> {
    validate<RouteRequest>('RouteRequest', request);
    if (request.dataVersion !== scope.dataVersion)
      throw new Failure(
        'DATA_VERSION_MISMATCH',
        409,
        'Route references use different dataset versions.'
      );
    await this.datasets.assertSnapshot(scope);
    if (request.stepFree && request.mode === 'stairs')
      invalid('Stairs cannot be combined with step-free routing.');
    if (request.origin.buildingId !== request.destination.buildingId)
      throw new Failure(
        'OUTDOOR_NETWORK_UNAVAILABLE',
        422,
        'No authoritative outdoor routing network is available.'
      );
    const building = await this.datasets.getBuilding(scope, request.origin.buildingId);
    if (!building.capabilities.navigation)
      throw new Failure('NO_ROUTE', 422, 'Navigation is unavailable for this building.');
    if (request.stepFree && !building.capabilities.verifiedStepFreeRouting)
      throw new Failure(
        'UNVERIFIED_ACCESSIBILITY',
        422,
        'A fully verified step-free route is unavailable.'
      );
    const cached = await this.graph(scope, building.id);
    // Virtual picked nodes belong to this request, never the cached graph.
    const graph: Graph = {
      source: cached.source,
      nodes: new Map(cached.nodes),
      adj: new Map([...cached.adj].map(([id, arcs]) => [id, [...arcs]])),
    };
    const origin = await this.endpoint(scope, request.origin, graph, 'origin');
    const destination = await this.endpoint(scope, request.destination, graph, 'destination');
    const dist = new Map([[origin.nodeId, 0]]);
    const previous = new Map<string, { id: string; edge: GraphEdge }>();
    const open = new Set([origin.nodeId]);
    const done = new Set<string>();
    while (open.size) {
      scope.signal?.throwIfAborted();
      const current = [...open].sort((a, b) => dist.get(a)! - dist.get(b)!)[0]!;
      open.delete(current);
      if (current === destination.nodeId) break;
      done.add(current);
      for (const { to, edge } of graph.adj.get(current) ?? []) {
        if (
          done.has(to) ||
          edge.accessLevel !== 'public' ||
          (request.mode === 'elevator' && edge.kind === 'stairs') ||
          (request.mode === 'stairs' && edge.kind === 'elevator') ||
          (request.stepFree && edge.stepFree !== 'verified_yes')
        )
          continue;
        const cost = edge.lengthMeters + (edge.kind === 'elevator' ? 25 : 0);
        const value = dist.get(current)! + cost;
        if (value < (dist.get(to) ?? Infinity)) {
          dist.set(to, value);
          previous.set(to, { id: current, edge });
          open.add(to);
        }
      }
    }
    if (!dist.has(destination.nodeId))
      throw new Failure(
        request.stepFree ? 'UNVERIFIED_ACCESSIBILITY' : 'NO_ROUTE',
        422,
        request.stepFree
          ? 'A fully verified step-free route is unavailable.'
          : 'No eligible connected route is available.'
      );
    const path: { from: GraphNode; to: GraphNode; edge: GraphEdge }[] = [];
    let current = destination.nodeId;
    while (current !== origin.nodeId) {
      const p = previous.get(current)!;
      path.unshift({ from: graph.nodes.get(p.id)!, to: graph.nodes.get(current)!, edge: p.edge });
      current = p.id;
    }
    const legs: RouteLeg[] = [];
    const steps: RouteStep[] = [];
    const addStep = (
      kind: RouteStep['kind'],
      text: string,
      leg: RouteLeg,
      index: number,
      floorId: string
    ) =>
      steps.push({
        id: `step:${steps.length}`,
        index: steps.length,
        kind,
        text,
        legId: leg.id,
        pointIndex: index,
        buildingId: building.id,
        floorId,
      });
    for (const p of path) {
      const vertical = p.from.floorId !== p.to.floorId;
      const previousLeg = legs.at(-1);
      if (!vertical && previousLeg?.kind === 'indoor' && previousLeg.floorId === p.from.floorId) {
        previousLeg.points.push(p.to.position);
        previousLeg.distanceMeters += p.edge.lengthMeters;
        previousLeg.durationSeconds += p.edge.lengthMeters / 1.3;
        continue;
      }
      const leg: RouteLeg = vertical
        ? {
            kind: 'vertical',
            id: `leg:${legs.length}`,
            buildingId: building.id,
            fromFloorId: p.from.floorId,
            toFloorId: p.to.floorId,
            connectorKind: p.edge.kind as 'stairs' | 'elevator' | 'ramp',
            connectorId: p.edge.id,
            points: [p.from.position, p.to.position],
            distanceMeters: p.edge.lengthMeters,
            durationSeconds: p.edge.kind === 'elevator' ? 35 : p.edge.lengthMeters / 0.5,
          }
        : {
            kind: 'indoor',
            id: `leg:${legs.length}`,
            buildingId: building.id,
            floorId: p.from.floorId,
            points: [p.from.position, p.to.position],
            distanceMeters: p.edge.lengthMeters,
            durationSeconds: p.edge.lengthMeters / 1.3,
          };
      legs.push(leg);
    }
    if (!legs.length)
      legs.push({
        kind: 'indoor',
        id: 'leg:0',
        buildingId: building.id,
        floorId: origin.floorId,
        points: [origin.position],
        distanceMeters: 0,
        durationSeconds: 0,
      });
    if (path.length) addStep('start', 'Start at the resolved origin.', legs[0]!, 0, origin.floorId);
    for (const leg of legs) {
      if (leg.kind === 'vertical')
        addStep(
          leg.connectorKind,
          `Take the ${leg.connectorKind} to floor ${leg.toFloorId}.`,
          leg,
          leg.points.length - 1,
          leg.toFloorId
        );
      else if (leg.kind === 'indoor' && leg.distanceMeters > 0)
        addStep(
          'walk',
          `Follow the corridor for about ${Math.round(leg.distanceMeters)} meters.`,
          leg,
          0,
          leg.floorId
        );
    }
    const last = legs.at(-1)!;
    addStep(
      'arrive',
      'Arrive at your destination.',
      last,
      last.points.length - 1,
      destination.floorId
    );
    const route: Route = {
      id: randomUUID(),
      origin,
      destination,
      mode: request.mode,
      accessProfile: 'public',
      distanceMeters: legs.reduce((s, l) => s + l.distanceMeters, 0),
      durationSeconds: legs.reduce((s, l) => s + l.durationSeconds, 0),
      metricsEstimated: building.provenance.verificationStatus !== 'verified',
      usesStairs: legs.some((l) => l.kind === 'vertical' && l.connectorKind === 'stairs'),
      usesElevator: legs.some((l) => l.kind === 'vertical' && l.connectorKind === 'elevator'),
      stepFreeRequested: request.stepFree,
      verifiedStepFree: request.stepFree,
      warnings: [
        {
          code: 'UNVERIFIED_DEMO',
          message:
            'Illustrative route from unverified plan data. Access and metrics are not surveyed.',
        },
      ],
      legs,
      steps,
      provenance: building.provenance,
    };
    validate<Route>('Route', route, true);
    return route;
  }
}
