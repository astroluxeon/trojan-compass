import { writeFileSync, readFileSync } from 'node:fs'
import { BUILDINGS } from '../../apps/web/src/data/campus'
import { getLevels, getLayout, getBuildingPlaces, findCell, cellCenter } from '../../apps/web/src/data/floorplan'

// These positions remain explicitly in preview scene units. They are NEVER sent to the API.
const interiors = BUILDINGS.map(b => ({
  id: b.code, name: b.name, detail: b.blurb, floors: getLevels(b.code).map(String),
  places: getBuildingPlaces(b.code).map(p => {
    const c = findCell(p.id)
    const e = getLayout(b.code, p.floor).entrances.find(e => e.id === p.node)
    const [x, z] = c ? cellCenter(c) : [e?.x ?? 0, e?.z ?? 0]
    return { id: p.id, buildingId: b.code, floorId: String(p.floor), label: p.label,
      detail: p.sub, kind: p.kind, x, z, y: (p.floor - 1) * 3.4, isRamp: e?.ramp === true,
      stepFreeAccess: 'unknown' }
  })
}))
const locations = JSON.parse(readFileSync(new URL('../../apps/campus-demo/locations.json', import.meta.url), 'utf8'))
const catalog = locations.filter((l: any) => ['Buildings', 'Parking'].includes(l.category)).map((l: any) => {
  const code = /Medicine Crow/i.test(l.name) ? 'VKC' : l.code
  const interior = interiors.find(b => b.id === code)
  return { id: String(l.id), code: code || '', name: l.name, category: l.category,
    latitude: l.lat, longitude: l.lng, paths: l.paths || [],
    interiorId: interior?.id, aliases: code === 'VKC' ? ['Medicine Crow', 'Von KleinSmid', 'DMC'] : [] }
})
writeFileSync(new URL('../TrojanCompass/Resources/preview-catalog.json', import.meta.url), JSON.stringify({ interiors, locations: catalog }))
