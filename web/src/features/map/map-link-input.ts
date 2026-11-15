import type { BuildingSummary, RouteMode } from "@trojan-compass/shared";
export function parseMapLink(
  query: URLSearchParams,
  buildings: BuildingSummary[],
) {
  const code = query.get("building")?.trim().toLowerCase();
  const building = buildings.find(
    (b) =>
      b.id.toLowerCase() === code ||
      b.aliases.some((alias) => alias.toLowerCase() === code),
  );
  const floor = query.get("floor");
  const mode = query.get("mode");
  return {
    buildingId: building?.id,
    floorId: floor === "B" ? "0" : floor && /^\d+$/.test(floor) ? floor : "1",
    allFloors: floor === "all",
    room: query.get("room"),
    from: query.get("from"),
    to: query.get("to"),
    mode: (mode === "stairs" || mode === "elevator"
      ? mode
      : "fastest") as RouteMode,
  };
}
