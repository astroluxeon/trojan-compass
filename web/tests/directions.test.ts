import test from 'node:test'
import assert from 'node:assert/strict'
import type { VerticalLeg } from '@trojan-compass/shared/api'
import { mapLocationRef } from '../src/features/routing/directions-input'
import { routeChevrons, scenePosition, sceneRoute, type ScenePoint } from '../src/features/routing/route-scene'
import { createApiClient } from '../src/lib/api-client'

test('picked positions convert horizontal units without scaling floor heights', () => {
  const ref=mapLocationRef({building:'LAW',floor:4,x:5,z:-2,label:'Open area'})
  assert.deepEqual(ref,{kind:'position',buildingId:'LAW',floorId:'4',position:{x:12,y:10.2,z:-4.8}})
  if(ref.kind==='position')assert.deepEqual(scenePosition('LAW',ref.position,0),[5,10.2,-2])
})
test('selecting one of two identically labeled restrooms preserves its unique ID',()=>{
  assert.deepEqual(mapLocationRef({building:'LAW',floor:4,x:0,z:0,label:'LAW restrooms, floor 4',placeId:'LAW-4-restroom-2'}),{kind:'place',buildingId:'LAW',placeId:'LAW-4-restroom-2'})
})
test('preview requests explicitly use their own endpoint and do not retry failed published routes',async()=>{
  const calls:string[]=[]
  const api=createApiClient('/api',(async(input)=>{calls.push(String(input));return Response.json({error:{code:'FEATURE_DISABLED',message:'Unavailable'}},{status:501})}) as typeof fetch)
  const body={clientRequestId:'r',dataVersion:'prototype-v1',origin:{kind:'place' as const,buildingId:'LAW',placeId:'LAW-101'},destination:{kind:'place' as const,buildingId:'LAW',placeId:'LAW-103'},mode:'stairs' as const,stepFree:false,accessProfile:'public' as const}
  await assert.rejects(api.route(body));assert.deepEqual(calls,['/api/routes']);await assert.rejects(api.previewRoute(body));assert.deepEqual(calls,['/api/routes','/api/preview/routes'])
})

test('offset stair and elevator landings retain their positions inside an upright up/down marker', () => {
  for (const connectorKind of ['stairs', 'elevator'] as const) {
    const leg: VerticalLeg = {
      kind: 'vertical', id: 'floor-change', buildingId: 'LAW',
      fromFloorId: '1', toFloorId: '3', connectorKind, connectorId: 'core-1',
      distanceMeters: 8, durationSeconds: 20,
      points: [{ x: 0, y: 0, z: 0 }, { x: 4.8, y: 6.8, z: -2.4 }],
    }
    const up = sceneRoute({ legs: [leg] }, 'LAW')[0]!
    const down = sceneRoute({ legs: [{
      ...leg, fromFloorId: '3', toFloorId: '1', points: [...leg.points].reverse(),
    }] }, 'LAW')[0]!
    assert.equal(up.kind, 'vertical')
    assert.equal(down.kind, 'vertical')
    if (up.kind !== 'vertical' || down.kind !== 'vertical') assert.fail('Missing floor-change marker')
    assert.equal(up.direction, 'up')
    assert.equal(down.direction, 'down')
    assert.equal(up.toFloor, 3)
    assert.equal(down.toFloor, 1)
    assert.deepEqual(up.entry, scenePosition('LAW', leg.points[0]!))
    assert.deepEqual(up.exit, scenePosition('LAW', leg.points[1]!))
    assert.deepEqual(down.entry, up.exit)
    assert.deepEqual(down.exit, up.entry)
    assert.deepEqual(down.center, up.center)
    assert.deepEqual(down.size, up.size)
    for (const point of [up.entry, up.exit]) {
      for (const axis of [0, 1, 2] as const) {
        assert.ok(Math.abs(point[axis] - up.center[axis]) <= up.size[axis] / 2 + 1e-9)
      }
    }
    assert.equal('points' in up, false, 'A floor change must not become a diagonal walking line')
  }
})

test('walking chevrons point toward the destination through turns and when the route reverses', () => {
  const path: ScenePoint[] = [[0, 0, 0], [2, 0, 0], [2, 0, 2]]
  const forward = routeChevrons(path), reverse = routeChevrons([...path].reverse())
  const direction = (arrow: ScenePoint[]) => [
    arrow[1]![0] - (arrow[0]![0] + arrow[2]![0]) / 2,
    arrow[1]![2] - (arrow[0]![2] + arrow[2]![2]) / 2,
  ]
  assert.equal(forward.length, 2)
  assert.equal(reverse.length, 2)
  assert.ok(direction(forward[0]!)[0]! > 0)
  assert.ok(direction(forward[1]!)[1]! > 0)
  assert.ok(direction(reverse[0]!)[1]! < 0)
  assert.ok(direction(reverse[1]!)[0]! < 0)
  assert.deepEqual(routeChevrons([[0, 0, 0], [0, 0, 0], [2, 3.4, 2]]), [])
})
