import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUILDINGS } from '../src/data/campus'
import { accessibleEntrancePlace, entrancePlace, getBuildingPlaces, getLevels, findPlace } from '../src/data/floorplan'
import { computeRoute } from '../src/lib/routing'

test('demo buildings support directions on every floor and step-free routes avoid stairs', () => {
  for (const building of BUILDINGS) {
    const places = getBuildingPlaces(building.code)
    for (const floor of getLevels(building.code)) {
      const room = places.find(p => p.floor === floor && p.kind === 'room')
      assert.ok(room, `${building.code} floor ${floor} has a room`)
      for (const mode of ['fastest', 'stairs', 'elevator'] as const) {
        const from = mode === 'elevator' ? accessibleEntrancePlace(building.code) : entrancePlace(building.code)
        const route = computeRoute(from, room, mode)
        assert.ok(route, `${building.code} floor ${floor}: ${mode}`)
        assert.ok(route.steps.length > 0)
        assert.ok(Number.isFinite(route.meters))
        if (mode === 'elevator') {
          assert.equal(route.usesStairs, false)
          assert.equal(route.entranceSteps, false)
        }
      }
    }
  }
  assert.equal(findPlace('INVALID-ROOM'), undefined)
})

test('cross-building demo route includes an outdoor leg', () => {
  const from = entrancePlace('LAW')
  const to = entrancePlace('THH')
  const route = computeRoute(from, to, 'elevator')
  assert.ok(route)
  assert.ok(route.legs.some(leg => leg.kind === 'outdoor'))
  assert.equal(route.usesStairs, false)
})
