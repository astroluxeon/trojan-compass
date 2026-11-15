export const SUPPORTED_CODES = ['DML', 'LVL', 'THH', 'VKC', 'TCC', 'SGM', 'SAL', 'KAP', 'LAW']

export function buildingCode(place) {
  const code = place.code || place.name.match(/\(([A-Z]+)\)$/)?.[1]
  if (SUPPORTED_CODES.includes(code)) return code
  // USC renamed the former Von KleinSmid Center; the interior demo still uses VKC.
  if (/Medicine Crow/i.test(place.name)) return 'VKC'
  return null
}

export function compassUrl(code) {
  if (!SUPPORTED_CODES.includes(code)) return null
  return `http://localhost:3100/?building=${code}&floor=all`
}

// Saved Google map uses Web Mercator at zoom 16, centered on these coordinates.
export function mapPoint(lat, lng) {
  const scale = 256 * 2 ** 16
  const mercatorY = (latitude) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360))
  return [(lng + 118.284647) / 360 * scale, (mercatorY(34.022798) - mercatorY(lat)) / (2 * Math.PI) * scale]
}
