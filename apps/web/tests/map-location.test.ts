import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cellCenter, cellTitle, getLayout } from '../src/data/floorplan'
import { mapLocationAt, mapLocationFromQuery } from '../src/lib/map-location'

test('Tommy drops snap to rooms and entrances, preserve open areas, and reject invalid points', () => {
  const layout = getLayout('LAW', 1)
  const room = layout.cells.find((cell) => cell.kind === 'room')!
  const [x, z] = cellCenter(room)
  assert.equal(mapLocationAt(layout, x, z)?.label, cellTitle(room))
  const entrance = layout.entrances[0]!
  assert.equal(mapLocationAt(layout, entrance.x + 0.1, entrance.z)?.label, `LAW ${entrance.label}`)
  assert.equal(mapLocationAt(layout, 10000, 10000), null)
  const block = layout.cells.find((cell) => cell.kind === 'block')
  if (block) assert.equal(mapLocationAt(layout, ...cellCenter(block)), null)
  let openPoint = false
  for (let px = -30; px < 30 && !openPoint; px += 0.5) {
    for (let pz = -30; pz < 30 && !openPoint; pz += 0.5) {
      const location = mapLocationAt(layout, px, pz)
      if (location?.label.endsWith('open area')) {
        assert.equal(location.x, px)
        assert.equal(location.z, pz)
        openPoint = true
      }
    }
  }
  assert.ok(openPoint, 'floor has selectable open areas')
})

test('typed room and building codes resolve to map locations, while unresolved text clears them', () => {
  const room = getLayout('LAW', 1).cells.find(cell => cell.id === 'LAW-101')!
  const [x, z] = cellCenter(room)
  for (const query of ['LAW 101', 'law101', 'LAW-101']) {
    assert.deepEqual(mapLocationFromQuery(query), { building: 'LAW', floor: 1, label: 'LAW 101', x, z })
  }
  assert.equal(mapLocationFromQuery('LAW 2-Lincoln')?.floor, 2)
  const entrance = getLayout('LAW', 1).entrances.find(entry => entry.entrance && entry.stepFree)!
  assert.deepEqual(mapLocationFromQuery('law'), { building: 'LAW', floor: 1, label: `LAW ${entrance.label}`, x: entrance.x, z: entrance.z })
  assert.equal(mapLocationFromQuery('THH 201')?.building, 'THH')
  for (const query of ['', 'LAW 10', 'XYZ', 'Outside the building', 'custom location']) assert.equal(mapLocationFromQuery(query), null)
})
