import assert from 'node:assert/strict';
import { test, after, before } from 'node:test';
import { createApp } from '../../server/src/app';
import { ViewerSession } from '../src/features/map/api-viewer';
import { client } from '../src/lib/api-client';
import { findCell } from '../src/features/map/data/viewer-data';
const server = createApp().listen(0, '127.0.0.1');
before(
  () =>
    new Promise<void>((resolve) => {
      if (server.listening) resolve();
      else server.once('listening', resolve);
    })
);
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input, options) =>
  nativeFetch(
    typeof input === 'string' && input.startsWith('/api')
      ? `http://127.0.0.1:${(server.address() as { port: number }).port}${input}`
      : input,
    options
  );
after(() => {
  globalThis.fetch = nativeFetch;
  server.closeAllConnections();
  return new Promise<void>((resolve) => server.close(() => resolve()));
});
test('scene staging, canonical selection and route drawing use the live backend contract', async () => {
  const session = new ViewerSession(await client.buildings());
  const place = await session.resolve('law 101');
  assert.equal(place.id, 'LAW-101');
  const prepared = await session.actions([
    {
      type: 'focus_place',
      buildingId: place.buildingId,
      floorId: place.floorId,
      placeId: place.id,
    },
  ]);
  assert.equal(findCell('LAW-101'), undefined, 'staging must not mutate the current scene');
  prepared.commit();
  assert.equal(findCell('LAW-101')?.floor, 1);
  assert.equal(prepared.selected, 'LAW-101');
  const response = await client.route({
    clientRequestId: crypto.randomUUID(),
    dataVersion: session.directory.dataVersion,
    origin: { kind: 'place', buildingId: 'LAW', placeId: 'LAW-101' },
    destination: { kind: 'place', buildingId: 'LAW', placeId: 'LAW-213' },
    mode: 'fastest',
    stepFree: false,
    accessProfile: 'public',
  });
  const result = await session.actions([{ type: 'show_route', route: response.route }]);
  assert.ok(result.route?.legs[0]?.floors.includes(2));
  assert.equal(result.route?.meters, response.route.distanceMeters);
  const before = findCell('LAW-101');
  await assert.rejects(
    session.actions([
      { type: 'focus_place', buildingId: 'LAW', floorId: '1', placeId: 'does-not-exist' },
    ])
  );
  assert.deepEqual(
    findCell('LAW-101'),
    before,
    'failed action batch preserves the installed scene'
  );
});
