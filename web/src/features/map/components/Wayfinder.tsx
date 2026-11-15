'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ChatTextRequest,
  ChatResponse,
  LocationRef,
  MapAction,
  RouteMode,
} from '@trojan-compass/shared';
import { client, APIRequestError } from '@/lib/api-client';
import { ViewerSession } from '../api-viewer';
import { parseMapLink } from '../map-link-input';
import { cellCenter, cellTitle, getLevels, getPlaces, floorY } from '../data/viewer-data';
import type { Route } from '../../routing/viewer-route';
import { COLORS, type LayerKey, type MapLocation, type View } from '../types';
import { MapLoading } from '@/components/layout/AppShellFallback';
import { Header } from '@/components/layout/Header';
import { FloorTools, type LocationField } from './FloorTools';
import { Breadcrumb, FloorSelector, LayerPanel, RouteBar } from './MapOverlays';

const MapCanvas = dynamic(() => import('../renderer/MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => <MapLoading />,
});
const DEFAULT_LAYERS: LayerKey[] = [
  'classrooms',
  'mensRestrooms',
  'womensRestrooms',
  'ramps',
  'elevators',
  'stairs',
  'entrances',
];
export default function Wayfinder() {
  const params = useSearchParams();
  const initial = useRef(params.toString());
  const session = useRef<ViewerSession | null>(null);
  const generation = useRef(0);
  const [view, setView] = useState<View>({ type: 'building', code: 'LAW', floor: 1 });
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [layers, setLayers] = useState(() => new Set(DEFAULT_LAYERS));
  const [route, setRoute] = useState<Route | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string>();
  const [locations, setLocations] = useState({ from: '', to: '' });
  const [refs, setRefs] = useState<Record<LocationField, LocationRef | null>>({
    from: null,
    to: null,
  });
  const [picking, setPicking] = useState<LocationField | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(null);

  function fail(error: unknown) {
    if (error instanceof APIRequestError && [409, 410].includes(error.status))
      return 'The dataset changed. Reload map data, then resolve your locations again.';
    return error instanceof Error ? error.message : 'The request failed. Please retry.';
  }
  function commit(result: Awaited<ReturnType<ViewerSession['actions']>>) {
    result.commit();
    setView(result.view);
    setSelectedCell(result.selected);
    setRoute(result.route);
    setActiveStep(0);
    setPicking(null);
  }
  useEffect(() => {
    let active = true;
    const token = ++generation.current;
    async function load() {
      try {
        const directory = await client.buildings();
        const next = new ViewerSession(directory);
        const link = parseMapLink(new URLSearchParams(initial.current), directory.items);
        let actions: MapAction[] = [
          { type: 'focus_floor', buildingId: link.buildingId ?? 'LAW', floorId: link.floorId },
        ];
        const desired = await next.prepare(link.buildingId ?? 'LAW');
        if (!desired.building.floors.some((f) => f.id === link.floorId))
          actions = [{ type: 'focus_building', buildingId: desired.building.id }];
        let notice = '';
        try {
          if (link.room) {
            const place = await next.resolve(link.room);
            if (
              !link.buildingId ||
              link.allFloors ||
              !new URLSearchParams(initial.current).has('floor') ||
              place.floorId === link.floorId
            )
              actions = [
                {
                  type: 'focus_place',
                  buildingId: place.buildingId,
                  floorId: place.floorId,
                  placeId: place.id,
                },
              ];
          }
          if (link.from && link.to) {
            const [from, to] = await Promise.all([next.resolve(link.from), next.resolve(link.to)]);
            const response = await client.route({
              clientRequestId: crypto.randomUUID(),
              dataVersion: directory.dataVersion,
              origin: { kind: 'place', buildingId: from.buildingId, placeId: from.id },
              destination: { kind: 'place', buildingId: to.buildingId, placeId: to.id },
              mode: link.mode,
              stepFree: false,
              accessProfile: 'public',
            });
            actions = [{ type: 'show_route', route: response.route }];
          }
        } catch (e) {
          notice = fail(e);
        }
        const result = await next.actions(actions);
        if (!active || token !== generation.current) return;
        session.current = next;
        setVersion(directory.dataVersion);
        commit(result);
        if (link.allFloors && result.view.type === 'building')
          setView({ ...result.view, allFloors: true });
        if (!link.buildingId && !link.room && !link.from && !link.to) setView({ type: 'campus' });
        setReady(true);
        setError(notice);
        setRefs({ from: null, to: null });
        setCurrentLocation(null);
      } catch (e) {
        if (active) setError(fail(e));
      }
    }
    void load();
    return () => {
      active = false;
      generation.current++;
    };
  }, [reload]);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams();
    if (view.type === 'building') {
      q.set('building', view.code);
      q.set('floor', view.allFloors ? 'all' : view.floor === 0 ? 'B' : String(view.floor));
      if (selectedCell) q.set('room', selectedCell);
    }
    if (route && !route.from.id.startsWith('picked:') && !route.to.id.startsWith('picked:')) {
      q.set('from', route.from.id);
      q.set('to', route.to.id);
      q.set('mode', route.mode);
    }
    window.history.replaceState(null, '', window.location.pathname + '?' + q);
  }, [view, route, selectedCell, ready]);

  async function execute(actions: MapAction[]) {
    const token = ++generation.current;
    const result = await session.current!.actions(actions);
    if (token === generation.current) {
      commit(result);
      setError('');
    }
  }
  async function search(query: string) {
    const token = ++generation.current;
    const s = session.current!;
    const building = s.directory.items.find((b) =>
      [b.id, b.name, ...b.aliases].some((x) => x.toLowerCase() === query.trim().toLowerCase())
    );
    const place = building ? null : await s.resolve(query);
    const result = await s.actions(
      building
        ? [{ type: 'focus_building', buildingId: building.id }]
        : [
            {
              type: 'focus_place',
              buildingId: place!.buildingId,
              floorId: place!.floorId,
              placeId: place!.id,
            },
          ]
    );
    if (token === generation.current) {
      commit(result);
      setError('');
    }
    return true;
  }
  function picked(location: MapLocation) {
    if (!picking) return;
    generation.current++;
    const ref: LocationRef = {
      kind: 'position',
      buildingId: location.building,
      floorId: String(location.floor),
      position: { x: location.x, y: floorY(location.floor, location.building), z: location.z },
    };
    setLocations((current) => ({ ...current, [picking]: location.label }));
    setRefs((current) => ({ ...current, [picking]: ref }));
    if (picking === 'from') setCurrentLocation(location);
    setPicking(null);
  }
  async function resolveField(field: LocationField): Promise<LocationRef> {
    if (refs[field]) return refs[field]!;
    const text = locations[field].trim();
    if (!text)
      throw new Error(`Choose a ${field === 'from' ? 'starting location' : 'destination'}.`);
    if (/^outside(?: the building)?$/i.test(text)) {
      const entrances = getPlaces(view.type === 'building' ? view.code : undefined).filter(
        (p) => p.kind === 'entrance' && p.access.entryAllowed
      );
      if (entrances.length !== 1)
        throw new Error('Choose a specific entrance on the map or by name.');
      return { kind: 'place', buildingId: entrances[0]!.buildingId, placeId: entrances[0]!.id };
    }
    const p = await session.current!.resolve(text);
    return { kind: 'place', buildingId: p.buildingId, placeId: p.id };
  }
  async function directions(mode: RouteMode, stepFree: boolean) {
    const token = ++generation.current;
    const [origin, destination] = await Promise.all([resolveField('from'), resolveField('to')]);
    const id = crypto.randomUUID();
    const response = await client.route({
      clientRequestId: id,
      dataVersion: version,
      origin,
      destination,
      mode,
      stepFree,
      accessProfile: 'public',
    });
    if (token !== generation.current) return;
    if (response.clientRequestId !== id || response.dataVersion !== version)
      throw new Error('Discarded a stale route response.');
    const result = await session.current!.actions([{ type: 'show_route', route: response.route }]);
    if (token !== generation.current) return;
    commit(result);
    setRefs({ from: origin, to: destination });
    if (origin.kind === 'position')
      setCurrentLocation({
        building: origin.buildingId as 'LAW',
        floor: Number(origin.floorId),
        label: locations.from,
        x: origin.position.x,
        z: origin.position.z,
      });
    else {
      const p = result.places.find(
        (p) => p.id === origin.placeId && p.buildingId === origin.buildingId
      );
      if (p)
        setCurrentLocation({
          building: p.buildingId as 'LAW',
          floor: Number(p.floorId),
          label: p.displayLabel,
          x: p.position.x,
          z: p.position.z,
        });
    }
  }
  async function chat(
    request: Pick<ChatTextRequest, 'message' | 'history' | 'preferences'>
  ): Promise<ChatResponse> {
    const token = ++generation.current;
    const id = crypto.randomUUID();
    const selected = getPlaces().find((p) => p.id === selectedCell);
    const response = await client.chat({
      ...request,
      clientRequestId: id,
      dataVersion: version,
      context: {
        buildingId: view.type === 'building' ? view.code : null,
        floorId: view.type === 'building' ? String(view.floor) : null,
        origin: refs.from,
        selectedPlace: selected
          ? { kind: 'place', buildingId: selected.buildingId, placeId: selected.id }
          : null,
      },
    });
    if (token !== generation.current)
      throw new Error('This reply was superseded by a newer map selection.');
    if (response.clientRequestId !== id || response.dataVersion !== version)
      throw new Error('Discarded a stale chat response.');
    if (response.status === 'resolved') {
      const result = await session.current!.actions(response.actions);
      if (token === generation.current) commit(result);
    }
    return response;
  }
  const highlights = useMemo(() => {
    const map = new Map<string, string>();
    if (route?.to.kind === 'room') map.set(route.to.id, COLORS.cardinal);
    return map;
  }, [route]);
  function selectFloor(floor: number) {
    generation.current++;
    if (view.type === 'building') {
      setView({ ...view, floor, allFloors: false });
      setSelectedCell(undefined);
    }
  }
  const routeFloors =
    view.type === 'building'
      ? (route?.legs.filter((l) => l.building === view.code).flatMap((l) => l.floors) ?? [])
      : [];
  return (
    <div className="flex h-full flex-col">
      <Header />
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 bg-cardinal-50 px-5 py-3 text-sm text-cardinal"
        >
          <span>{error}</span>
          <button
            className="shrink-0 font-bold underline"
            onClick={() => {
              initial.current =
                view.type === 'building' ? `building=${view.code}&floor=${view.floor}` : '';
              setReload((x) => x + 1);
            }}
          >
            Reload map data
          </button>
        </div>
      )}
      {!ready ? (
        <MapLoading />
      ) : (
        <main id="main" className="relative flex min-h-0 flex-1 bg-white">
          <div className="relative min-w-0 flex-1">
            <MapCanvas
              view={view}
              layers={layers}
              route={route}
              highlights={highlights}
              selectedCell={selectedCell}
              currentLocation={currentLocation}
              placingCurrentLocation={picking === 'from'}
              onMoveCurrentLocation={() => setPicking('from')}
              onSelectLocation={picking ? picked : undefined}
              onSelectBuilding={(code) =>
                void execute([{ type: 'focus_building', buildingId: code }]).catch((e) =>
                  setError(fail(e))
                )
              }
              onSelectCell={(cell) => {
                if (picking) {
                  const [x, z] = cellCenter(cell);
                  picked({
                    building: cell.building,
                    floor: cell.floor,
                    label: cellTitle(cell),
                    x,
                    z,
                  });
                } else {
                  generation.current++;
                  setSelectedCell(cell.id);
                  setView({ type: 'building', code: cell.building, floor: cell.floor });
                }
              }}
              onSelectFloor={selectFloor}
            />
            <Breadcrumb view={view} onCampus={() => setView({ type: 'campus' })} />
            {route && (
              <RouteBar
                route={route}
                active={activeStep}
                onStep={(i) => {
                  const step = route.steps[i];
                  if (step?.building) {
                    setActiveStep(i);
                    setView({ type: 'building', code: step.building, floor: step.floor ?? 1 });
                  }
                }}
                onClose={() => {
                  setRoute(null);
                  setActiveStep(0);
                }}
              />
            )}
            {view.type === 'building' && (
              <FloorSelector
                code={view.code}
                levels={getLevels(view.code)}
                floor={view.floor}
                allFloors={view.allFloors}
                routeFloors={routeFloors}
                currentFloor={
                  currentLocation?.building === view.code ? currentLocation.floor : undefined
                }
                onSelect={selectFloor}
                onSelectAll={() => {
                  generation.current++;
                  setPicking(null);
                  setView({ ...view, allFloors: true });
                  setSelectedCell(undefined);
                }}
              />
            )}
            <LayerPanel
              layers={layers}
              view={view}
              onToggle={(key) =>
                setLayers((current) => {
                  const next = new Set(current);
                  if (next.has(key)) next.delete(key);
                  else next.add(key);
                  return next;
                })
              }
            />
            <p className="pointer-events-none absolute bottom-3 right-3 max-w-xs rounded bg-white/90 px-2 py-1 text-[10px] text-neutral-500">
              Illustrative USC map · access and navigation unverified
            </p>
          </div>
          <FloorTools
            dataVersion={version}
            locations={locations}
            picking={picking}
            onPick={(field) => {
              generation.current++;
              setPicking(field);
              if (field && view.type === 'building') setView({ ...view, allFloors: false });
            }}
            onSearch={search}
            onDirections={directions}
            onChat={chat}
            onDraftChange={() => {
              generation.current++;
            }}
            onLocationChange={(field, value) => {
              generation.current++;
              setLocations((current) => ({ ...current, [field]: value }));
              setRefs((current) => ({ ...current, [field]: null }));
              if (field === 'from') setCurrentLocation(null);
            }}
          />
        </main>
      )}
    </div>
  );
}
