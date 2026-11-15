import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findRoom } from '../src/data/floorplan'

test('room codes accept spaces, hyphens, compact text, and lowercase', () => {
  for (const query of ['LAW 101', 'law-101', 'LAW101', '  law   101  ']) {
    const room = findRoom(query)
    assert.equal(room?.id, 'LAW-101')
    assert.equal(room?.building, 'LAW')
    assert.equal(room?.floor, 1)
  }
  assert.equal(findRoom('THH 201')?.building, 'THH')
  assert.equal(findRoom('THH 201')?.floor, 2)
})

test('invalid and partial codes never select a different room', () => {
  for (const query of ['', 'LAW', 'LAW 10', 'LAW 99999', 'XYZ 101', 'LAW ENT']) {
    assert.equal(findRoom(query), undefined, query)
  }
})
