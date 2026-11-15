import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { ChatTextRequest, Route } from '@trojan-compass/shared/api'
import { createApiClient } from '../src/lib/api-client'
import { prototypeMapAction, routeMapLocation } from '../src/features/chat/map-action-adapter'
import { sceneRoute } from '../src/features/routing/route-scene'

function routeFixture(): Route {
  const route = JSON.parse(readFileSync(new URL('../../shared/fixtures/examples/route-cross-floor.json', import.meta.url), 'utf8')).route as Route
  route.destination.placeId = 'LAW-201'
  route.destination.requested = {kind:'place',buildingId:'LAW',placeId:'LAW-201'}
  return route
}
test('chat route actions feed the same renderer and preserve the origin for follow-ups', () => {
  const route = routeFixture()
  const update = prototypeMapAction({type:'show_route',route}, 'prototype-v1')
  assert.deepEqual(update.view, {type:'building',code:'LAW',floor:2})
  assert.equal(update.selectedCell,'LAW-201')
  assert.equal(update.route,route)
  const origin = routeMapLocation(route.origin)
  assert.equal(origin.placeId,'LAW-101')
  assert.equal(origin.floor,1)
  assert.equal(origin.x,route.origin.position.x / 2.4)
  assert.ok(sceneRoute(route,'LAW').some(leg=>leg.kind==='vertical' && leg.connectorKind==='elevator'))
})
test('invalid chat routes cannot mutate the map or switch dataset coordinates', () => {
  assert.throws(()=>prototypeMapAction({type:'show_route',route:routeFixture()},'other'),/updated viewer/)
  for(const mutate of [
    (r:Route)=>{r.destination.placeId='LAW-UNKNOWN'},
    (r:Route)=>{r.origin.floorId='99'},
    (r:Route)=>{r.origin.position.x=NaN},
    (r:Route)=>{r.steps[0]!.pointIndex=999999},
    (r:Route)=>{r.legs=[]},
  ]) {
    const route=routeFixture(); mutate(route)
    assert.throws(()=>prototypeMapAction({type:'show_route',route},'prototype-v1'))
  }
})
test('preview chat sends context/preferences and validates correlation and response structure', async () => {
  const body:ChatTextRequest={clientRequestId:'chat-test',dataVersion:'prototype-v1',message:'Take me there',history:[],context:{buildingId:'LAW',floorId:'2',selectedPlace:{kind:'place',buildingId:'LAW',placeId:'LAW-201'},origin:{kind:'place',buildingId:'LAW',placeId:'LAW-101'}},preferences:{mode:'elevator',stepFree:true,accessProfile:'public'}}
  let response:Record<string,unknown>={requestId:'server',clientRequestId:'chat-test',dataVersion:'prototype-v1',status:'resolved',message:'Route ready',actions:[],clarification:null,citations:[]}
  const api=createApiClient('/api',(async(url,options)=>{
    assert.equal(url,'/api/preview/chat')
    assert.deepEqual(JSON.parse(String(options?.body)),body)
    return Response.json(response)
  }) as typeof fetch)
  assert.equal((await api.previewChat(body)).status,'resolved')
  response={...response,actions:null}
  await assert.rejects(api.previewChat(body),{code:'INVALID_RESPONSE'})
  response={...response,clientRequestId:'other'}
  await assert.rejects(api.previewChat(body),{code:'STALE_RESPONSE'})
})
