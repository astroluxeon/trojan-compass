import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { FloorSelector } from '../src/features/map/components/MapOverlays'

test('the current-location floor stays marked while another floor or all floors are selected', () => {
  for (const currentFloor of [0, 1]) for (const allFloors of [false, true]) {
    const html = renderToStaticMarkup(createElement(FloorSelector, {
      levels: [0, 1, 2], floor: 2, allFloors, currentFloor, routeFloors: [], onSelect() {}, onSelectAll() {},
    }))
    assert.match(html, /ring-gold/)
    assert.match(html, new RegExp(`aria-label="${currentFloor === 0 ? 'Basement' : 'Floor 1'} · Current location"`))
    assert.equal((html.match(/>Current location</g) ?? []).length, 1)
  }
})

test('no current-location floor is marked before a location is selected', () => {
  const html = renderToStaticMarkup(createElement(FloorSelector, {
    levels: [0, 1, 2], floor: 1, routeFloors: [2], onSelect() {}, onSelectAll() {},
  }))
  assert.doesNotMatch(html, /Current location|ring-gold/)
  assert.match(html, /aria-label="Floor 1"[^>]*aria-pressed="true"/)
})
