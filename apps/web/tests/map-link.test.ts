import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findPlace, getBuildingPlaces } from '../src/data/floorplan'
import { readDeepLink } from '../src/lib/map-link'

test('an explicit floor overrides a stale room left in an older saved link', () => {
  const link = readDeepLink(new URLSearchParams('building=LAW&floor=2&room=LAW-101'))
  assert.deepEqual(link.view, { type: 'building', code: 'LAW', floor: 2, allFloors: false })
  assert.equal(link.room, undefined)
  const all = readDeepLink(new URLSearchParams('building=LAW&floor=all&room=LAW-101'))
  assert.equal(all.room?.id, 'LAW-101')
  assert.deepEqual(all.view, { type: 'building', code: 'LAW', floor: 1, allFloors: true })
})

test('saved LAW room and amenity IDs retain their canonical case and floor', () => {
  for (const place of getBuildingPlaces('LAW')) {
    for (const id of [place.id, place.id.toUpperCase(), place.id.toLowerCase()]) {
      assert.equal(findPlace(id)?.id, place.id)
      const link = readDeepLink(new URLSearchParams({ building: 'law', floor: place.floor === 0 ? 'B' : String(place.floor), room: id }))
      assert.equal(link.room?.id, place.id)
      assert.deepEqual(link.view, { type: 'building', code: 'LAW', floor: place.floor, allFloors: false })
    }
  }
})

test('a room-only link opens its floor and mixed-case route endpoints resolve', () => {
  const room = readDeepLink(new URLSearchParams('room=LAW-2-Lincoln'))
  assert.equal(room.room?.id, 'LAW-2-Lincoln')
  assert.deepEqual(room.view, { type: 'building', code: 'LAW', floor: 2, allFloors: false })
  const route = readDeepLink(new URLSearchParams('from=LAW-1-elevatorEC&to=LAW-101&mode=elevator'))
  assert.equal(route.route?.from.id, 'LAW-1-elevatorEC')
  assert.equal(route.route?.to.id, 'LAW-101')
  assert.ok(route.route?.steps.length)
})

test('an entrance-to-entrance route keeps its outdoor initial view', () => {
  const link = readDeepLink(new URLSearchParams('from=LAW-ENT&to=THH-ENT'))
  assert.deepEqual(link.view, { type: 'campus' })
  assert.equal(link.route?.steps[0]?.icon, 'outdoor')
  assert.equal(link.route?.legs[0]?.kind, 'outdoor')
})

test('a same-place route opens its building floor with an arrival step', () => {
  const link = readDeepLink(new URLSearchParams('from=LAW-101&to=LAW-101'))
  assert.deepEqual(link.view, { type: 'building', code: 'LAW', floor: 1 })
  assert.equal(link.route?.steps[0]?.icon, 'arrive')
})

test('invalid locations are rejected and invalid floor values fall back safely', () => {
  const empty = readDeepLink(new URLSearchParams('building=XYZ&room=XYZ-101&from=bad&to=bad'))
  assert.deepEqual(empty.view, { type: 'campus' })
  assert.equal(empty.room, undefined)
  assert.equal(empty.route, null)
  assert.deepEqual(readDeepLink(new URLSearchParams('building=LAW&floor=999')).view, { type: 'building', code: 'LAW', floor: 1, allFloors: false })
})
