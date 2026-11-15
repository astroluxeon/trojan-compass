import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { INTERIORS } from "../src/infrastructure/datasets/prototype/interiors/index.js";
import {
  BUILDINGS,
  type BuildingCode,
} from "../src/infrastructure/datasets/prototype/campus.js";
import {
  findRoom,
  findPlace,
  getLayout,
  getLevels,
  getBuildingPlaces,
  entrancePlace,
  floorName,
  type FloorLayout,
} from "../src/infrastructure/datasets/prototype/floorplan.js";
import {
  computeRoute,
  isStepFreePlace,
} from "../src/modules/routing/prototype/routing.js";
import { SnapshotRepository } from "../src/infrastructure/datasets/snapshot-loader.js";
import { RoutingService } from "../src/modules/routing/routing.service.js";

const eps = 0.0001;
const contains = (L: FloorLayout, x: number, z: number) =>
  L.slabs.some(
    ([a, b, c, d]) =>
      x >= a - eps && x <= c + eps && z >= b - eps && z <= d + eps,
  );
const sample = (
  a: number[],
  b: number[],
  fn: (x: number, z: number) => void,
) => {
  const steps = Math.ceil(Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!) / 0.1);
  for (let i = 0; i <= steps; i++)
    fn(
      a[0]! + ((b[0]! - a[0]!) * i) / (steps || 1),
      a[1]! + ((b[1]! - a[1]!) * i) / (steps || 1),
    );
};

test("every non-LAW building loads explicit floor specs with complete inference evidence and unique IDs/numbers", () => {
  assert.equal(Object.keys(INTERIORS).length, BUILDINGS.length - 1);
  const ids = new Set<string>();
  for (const [code, spec] of Object.entries(INTERIORS)) {
    const numbers = new Set<string>();
    assert.deepEqual(
      getLevels(code as BuildingCode),
      spec.floors.map((f) => f.level),
    );
    for (const f of spec.floors) {
      const L = getLayout(code as BuildingCode, f.level);
      assert.equal(L.evidence?.positionStatus, "inferred");
      assert.equal(L.cells.length, f.records.length);
      for (const c of L.cells) {
        assert.ok(!ids.has(c.id), c.id);
        ids.add(c.id);
        assert.equal(c.evidence?.positionStatus, "inferred", c.id);
        assert.ok(c.evidence?.sources.length, c.id);
        if (c.number) {
          assert.ok(!numbers.has(c.number), `${code} duplicate ${c.number}`);
          numbers.add(c.number);
        }
        assert.equal(c.evidence?.numberStatus === "not applicable", !c.number);
        if (c.kind !== "room")
          assert.equal(c.evidence?.accessibilityStatus, "inferred");
      }
    }
  }
  assert.throws(() => getLayout("VKC", 4), RangeError);
});

test("rooms, boundaries, doors, and corridor edges stay on their floor and avoid other rooms", () => {
  for (const code of Object.keys(INTERIORS))
    for (const floor of getLevels(code as BuildingCode)) {
      const L = getLayout(code as BuildingCode, floor);
      for (const c of L.cells) {
        for (let x = c.x0; x <= c.x1 + eps; x += 0.2)
          for (let z = c.z0; z <= c.z1 + eps; z += 0.2)
            assert.ok(contains(L, x, z), `${c.id} outside slab at ${x},${z}`);
        for (const p of [
          [c.x0, c.z0],
          [c.x1, c.z0],
          [c.x1, c.z1],
          [c.x0, c.z1],
        ])
          assert.ok(contains(L, p[0]!, p[1]!), `${c.id} corner`);
        const [x, z] = c.door;
        assert.ok(
          x >= c.x0 - eps &&
            x <= c.x1 + eps &&
            z >= c.z0 - eps &&
            z <= c.z1 + eps &&
            Math.min(
              Math.abs(x - c.x0),
              Math.abs(x - c.x1),
              Math.abs(z - c.z0),
              Math.abs(z - c.z1),
            ) < eps,
          `${c.id} door on boundary`,
        );
        assert.ok(
          L.walkNodes.some((n) => Math.hypot(n.x - x, n.z - z) < eps),
          `${c.id} door attached explicitly`,
        );
        for (const other of L.cells)
          if (other.id > c.id)
            assert.ok(
              Math.min(c.x1, other.x1) - Math.max(c.x0, other.x0) <= eps ||
                Math.min(c.z1, other.z1) - Math.max(c.z0, other.z0) <= eps,
              `${c.id} overlaps ${other.id}`,
            );
      }
      const nodes = new Map(L.walkNodes.map((n) => [n.id, n]));
      for (const [a, b] of L.walkEdges) {
        const na = nodes.get(a)!,
          nb = nodes.get(b)!;
        assert.ok(na && nb);
        sample([na.x, na.z], [nb.x, nb.z], (x, z) => {
          assert.ok(
            contains(L, x, z),
            `${code} ${floor} corridor outside slab at ${x},${z}`,
          );
          for (const c of L.cells)
            assert.ok(
              !(
                x > c.x0 + eps &&
                x < c.x1 - eps &&
                z > c.z0 + eps &&
                z < c.z1 - eps
              ),
              `${code} ${floor} corridor crosses ${c.id} at ${x},${z}`,
            );
        });
      }
      for (const v of L.voids ?? []) {
        const [x0, z0, x1, z1] = v.rect;
        assert.equal(
          contains(L, (x0 + x1) / 2, (z0 + z1) / 2),
          false,
          `${code} courtyard is not walkable`,
        );
      }
      for (const e of L.entrances) {
        assert.ok(contains(L, e.x, e.z));
        assert.ok(
          [
            [0.1, 0],
            [-0.1, 0],
            [0, 0.1],
            [0, -0.1],
          ].some(([dx, dz]) => !contains(L, e.x + dx!, e.z + dz!)),
          `${code} entrance ${e.id} must be at exterior boundary`,
        );
      }
    }
});

test("corridor graphs are connected, cores align, and every place can be reached by each demo mode", () => {
  for (const code of Object.keys(INTERIORS)) {
    const lastCore = new Map<string, { x: number; z: number; floor: number }>();
    for (const floor of getLevels(code as BuildingCode)) {
      const L = getLayout(code as BuildingCode, floor);
      const seen = new Set([L.walkNodes[0]!.id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const [a, b] of L.walkEdges)
          if (seen.has(a) || seen.has(b)) {
            for (const n of [a, b])
              if (!seen.has(n)) {
                seen.add(n);
                changed = true;
              }
          }
      }
      assert.equal(
        seen.size,
        L.walkNodes.length,
        `${code} ${floor} corridor connectivity`,
      );
      for (const c of L.cells)
        if (c.core) {
          const x = (c.x0 + c.x1) / 2,
            z = (c.z0 + c.z1) / 2,
            prev = lastCore.get(c.core);
          if (prev)
            assert.ok(
              Math.hypot(x - prev.x, z - prev.z) < eps,
              `${code} ${c.core} vertical alignment`,
            );
          lastCore.set(c.core, { x, z, floor });
        }
    }
    for (const p of getBuildingPlaces(code as BuildingCode))
      for (const mode of ["fastest", "stairs", "elevator"] as const) {
        const route = computeRoute(
          entrancePlace(code as BuildingCode),
          p,
          mode,
        );
        assert.ok(route, `${p.id} ${mode}`);
        assert.equal(route.inferred, true);
        if (mode === "elevator") assert.equal(route.usesStairs, false);
      }
  }
});

test("LAW geometry stays unchanged while reconstructed aliases and floors are retained", () => {
  const hashes = [
    "cf6342b0d449d9bd115008f5bfb0d086353013344126d32dfbaaf6187ebe2f12",
    "b1e9f7b82a8c404a2400e735ca246ade6ddcfd696d684e1d3ae22f5f318f9c2e",
    "05a6de5c571467d32a52dae246ffe870e5e109438c70aea7bd16801d0af3e45d",
    "ac3e6667c5e0d45448d2a2bfd8277da96c433b8b339de1e1a1a8999a6de11f4f",
    "e00754c758fd9630822aa8b2eaaa4bd176263ef5f8d4533ad43ac7bdfb4903c1",
  ];
  for (const [floor, hash] of hashes.entries())
    assert.equal(
      createHash("sha256")
        .update(JSON.stringify(getLayout("LAW", floor)))
        .digest("hex"),
      hash,
    );
  assert.equal(findRoom("DMC 100")?.id, "VKC-100");
  assert.equal(findRoom("SGM 601")?.floor, 6);
  assert.equal(floorName(2, "DML"), "First floor");
  assert.equal(findPlace("DML-ENT-NORTH-MAIN")?.floor, 2);
  for (const key of Object.keys(INTERIORS))
    assert.equal(isStepFreePlace(entrancePlace(key as BuildingCode)), false);
});

test("active snapshot preserves reconstructed floors, identities, evidence and usable routes to every destination", async () => {
  const repo = new SnapshotRepository();
  const version = await repo.currentVersion();
  const scope = { requestId: "interior-migration", dataVersion: version };
  const routing = new RoutingService(repo);
  for (const [key, spec] of Object.entries(INTERIORS)) {
    const code = key as BuildingCode;
    const building = await repo.getBuilding(scope, code);
    const places = await repo.listPlaces(scope, code);
    assert.deepEqual(
      building.floors.map((f) => Number(f.id)),
      spec.floors.map((f) => f.level),
    );
    assert.equal(building.name, spec.name);
    assert.equal(building.capabilities.verifiedStepFreeRouting, false);
    for (const floor of spec.floors) {
      const geometry = await repo.getFloorGeometry(
        scope,
        code,
        String(floor.level),
      );
      const ids = new Set(geometry!.objects.map((o) => o.objectKey));
      assert.equal(
        building.floors.find((f) => f.id === String(floor.level))!.label,
        floor.name,
      );
      for (const cell of getLayout(code, floor.level).cells.filter(
        (c) => c.kind !== "block",
      )) {
        const place = places.find((p) => p.id === cell.id)!;
        assert.ok(place, cell.id);
        assert.ok(ids.has(place.sceneObjectKey!), cell.id);
        assert.equal(place.floorId, String(floor.level));
        assert.match(place.provenance.note, /position inferred/);
        assert.match(place.provenance.note, /Sources: .+/, cell.id);
        const result = await routing.calculateRoute(scope, {
          clientRequestId: crypto.randomUUID(),
          dataVersion: version,
          origin: {
            kind: "place",
            buildingId: code,
            placeId: entrancePlace(code).id,
          },
          destination: { kind: "place", buildingId: code, placeId: cell.id },
          mode: "fastest",
          stepFree: false,
          accessProfile: "public",
        });
        assert.equal(result.destination.placeId, cell.id);
      }
      const destination = places.find(
        (p) => p.floorId === String(floor.level) && p.kind === "classroom",
      )!;
      for (const mode of ["stairs", "elevator"] as const) {
        const result = await routing.calculateRoute(scope, {
          clientRequestId: crypto.randomUUID(),
          dataVersion: version,
          origin: {
            kind: "place",
            buildingId: code,
            placeId: entrancePlace(code).id,
          },
          destination: {
            kind: "place",
            buildingId: code,
            placeId: destination.id,
          },
          mode,
          stepFree: false,
          accessProfile: "public",
        });
        if (mode === "elevator") assert.equal(result.usesStairs, false);
      }
    }
  }
});
