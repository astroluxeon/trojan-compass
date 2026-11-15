import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { buildingCode, compassUrl, mapPoint, SUPPORTED_CODES } from './map-data.js'

const places = JSON.parse(await readFile(new URL('./locations.json', import.meta.url)))

test('official building records link to every supported interior, with no false fallback', () => {
  for (const code of SUPPORTED_CODES) {
    assert.ok(places.some(place => buildingCode(place) === code), `${code} has an official map location`)
    const url = new URL(compassUrl(code))
    assert.equal(url.port, '3100')
    assert.equal(url.searchParams.get('building'), code)
    assert.equal(url.searchParams.get('floor'), 'all')
  }
  assert.equal(buildingCode({ name: 'Bovard Administration Building (ADM)', code: 'ADM' }), null)
  assert.equal(compassUrl('ADM'), null)
})

test('map projection aligns with saved Taper Hall marker', () => {
  const [x, y] = mapPoint(34.022186, -118.284485)
  assert.ok(Math.abs(x - 7) < 1)
  assert.ok(Math.abs(y - 35) < 1)
  assert.deepEqual(mapPoint(34.022798, -118.284647), [0, 0])
})
