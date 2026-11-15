import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureBuildings } from './viewer-fixtures';
import { parseMapLink } from '../src/features/map/map-link-input';

test('saved links preserve room and route references for backend resolution', () => {
  const link = parseMapLink(
    new URLSearchParams(
      'building=law&floor=B&room=LAW-2-Lincoln&from=LAW-101&to=LAW-107&mode=elevator'
    ),
    fixtureBuildings
  );
  assert.equal(link.buildingId, 'LAW');
  assert.equal(link.floorId, '0');
  assert.equal(link.room, 'LAW-2-Lincoln');
  assert.equal(link.from, 'LAW-101');
  assert.equal(link.to, 'LAW-107');
  assert.equal(link.mode, 'elevator');
});
test('all floors and unknown building values are handled without inventing records', () => {
  assert.equal(parseMapLink(new URLSearchParams('building=DMC&floor=all'), fixtureBuildings).buildingId, 'VKC');
  assert.equal(
    parseMapLink(new URLSearchParams('building=LAW&floor=all'), fixtureBuildings).allFloors,
    true
  );
  const link = parseMapLink(
    new URLSearchParams('building=XYZ&floor=bad&mode=bad'),
    fixtureBuildings
  );
  assert.equal(link.buildingId, undefined);
  assert.equal(link.floorId, '1');
  assert.equal(link.mode, 'fastest');
});
