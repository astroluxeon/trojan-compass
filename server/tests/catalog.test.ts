import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import {
  DemoCatalog,
  demoRecords,
  type CatalogRecord,
} from "../src/modules/catalog/demo-catalog.js";
import { prototypeStore } from "../src/infrastructure/datasets/prototype-adapter.js";
import { createServices } from "../src/bootstrap/services.js";
import { ChatService } from "../src/modules/chat/chat.service.js";
import { PreviewRoutingService } from "../src/modules/routing/preview/preview-routing.service.js";
import {
  DisabledIntentAdapter,
  OpenAIIntentAdapter,
} from "../src/integrations/ai/provider-adapter.js";
import { createApp } from "../src/app.js";
import { chatRequest, intent } from "./support/fixture.js";
import type { IntentAdapter } from "../src/integrations/ai/intent.js";
import type OpenAI from "openai";

const scope = () => ({ requestId: randomUUID(), dataVersion: "prototype-v1" });
const setup = (adapter: IntentAdapter) => {
  const datasets = prototypeStore();
  const catalog = new DemoCatalog();
  const services = createServices(
    datasets,
    () => datasets.currentVersion,
    "demo-catalog-test-secret-at-least-32-bytes",
    adapter,
  );
  const chat = new ChatService(
    { ...services, routing: new PreviewRoutingService() },
    adapter,
    catalog,
  );
  return { services, catalog, chat };
};
test("fixtures reference real map objects and remain explicitly synthetic", async () => {
  const catalog = new DemoCatalog();
  await catalog.validateLocations(prototypeStore(), scope());
  assert.equal(catalog.search("").length, 7);
  assert.equal(catalog.search("", "class").length, 4);
  assert.equal(catalog.search("", "event").length, 3);
  for (const r of catalog.search("")) {
    assert.equal(r.source.official, false);
    assert.equal(r.source.url, null);
    assert.equal(r.location.buildingId, "LAW");
  }
  catalog.get("demo-writ-340").location.placeId = "mutated";
  assert.equal(catalog.get("demo-writ-340").location.placeId, "LAW-201");
  const bad = structuredClone([...demoRecords]);
  bad[0]!.location.floorId = "4";
  await assert.rejects(
    new DemoCatalog(bad).validateLocations(prototypeStore(), scope()),
    /floor mismatch/,
  );
});
test("retrieval handles aliases and rejects unsupported courses and unrelated organizer events", () => {
  const c = new DemoCatalog();
  for (const [query, id] of [
    ["where is writ340", "demo-writ-340"],
    ["take me to dumpling making", "demo-casa-dumplings"],
    ["navratri", "demo-ais-navratri"],
    ["global food fest", "demo-isa-food"],
    ["CSCI 356", "demo-csci-356"],
    ["EE354", "demo-ee-354"],
    ["BUAD 298", "demo-buad-298"],
    ["where is AI Essentials", "demo-buad-298"],
  ])
    assert.equal(c.search(query!)[0]?.id, id);
  assert.deepEqual(c.search("CSCI 999"), []);
  assert.deepEqual(c.search("ISA basketball"), []);
  assert.deepEqual(c.search("ENGR 777"), []);
  assert.throws(() => c.assertVersion("other"), {
    code: "DATA_VERSION_MISMATCH",
  });
});
test("retrieved data reaches the model; validated records produce attributed highlights", async () => {
  let evidence: unknown;
  const { chat } = setup({
    interpret: async (_scope, _request, records) => {
      evidence = records;
      return intent({ kind: "find_place", query: "WRIT 340" });
    },
  });
  const r = await chat.respond(
    scope(),
    chatRequest({ dataVersion: "prototype-v1", message: "Where is WRIT 340?" }),
  );
  assert.ok(Array.isArray(evidence) && evidence[0].id === "demo-writ-340");
  assert.deepEqual(r.actions, [
    {
      type: "focus_place",
      buildingId: "LAW",
      floorId: "2",
      placeId: "LAW-201",
    },
  ]);
  assert.match(r.message, /\[Demo\].*WRIT 340.*11:00.*LAW 201/);
});
test("event routes use the same preview router for stairs/elevators and require an origin", async () => {
  for (const mode of ["stairs", "elevator"] as const) {
    const { chat } = setup({
      interpret: async () =>
        intent({
          kind: "route",
          query: "AIS USC Navratri",
          requestedMode: mode,
        }),
    });
    const request = chatRequest({
      dataVersion: "prototype-v1",
      message: "Take me to Navratri",
      context: {
        buildingId: "LAW",
        floorId: "1",
        selectedPlace: null,
        origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
      },
    });
    const response = await chat.respond(scope(), request);
    const action = response.actions[0];
    assert.equal(action?.type, "show_route");
    if (action?.type !== "show_route") throw new Error("Missing route");
    assert.equal(action.route.destination.placeId, "LAW-431");
    assert.equal(action.route.usesElevator, mode === "elevator");
    assert.equal(action.route.usesStairs, mode === "stairs");
    assert.ok(
      action.route.warnings.some((w) => w.code === "ILLUSTRATIVE_ROUTE"),
    );
    const noOrigin = await chat.respond(scope(), {
      ...request,
      context: { ...request.context, origin: null },
    });
    assert.equal(noOrigin.clarification?.reason, "missing_origin");
    assert.deepEqual(noOrigin.actions, []);
  }
});
test("multiple course occurrences produce clarification instead of first-match selection", async () => {
  const adapter: IntentAdapter = {
    interpret: async () => intent({ kind: "find_place", query: "WRIT 340" }),
  };
  const { services } = setup(adapter);
  const second = {
    ...structuredClone(demoRecords[1]!),
    id: "demo-writ-second",
  };
  const catalog = new DemoCatalog([...demoRecords, second]);
  const chat = new ChatService(services, adapter, catalog);
  const r = await chat.respond(
    scope(),
    chatRequest({ dataVersion: "prototype-v1" }),
  );
  assert.equal(r.status, "needs_clarification");
  assert.deepEqual(r.actions, []);
  assert.match(r.message, /demo-writ-second/);
});
test("HTTP catalog is opt-in, validates filters/versions, and does not masquerade as official events", async (t) => {
  const { services, catalog, chat } = setup(new DisabledIntentAdapter());
  for (const enabled of [false, true]) {
    const server = createApp(
      services,
      enabled ? { demo: { catalog, chat } } : {},
    ).listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => {
      server.closeAllConnections();
      server.close();
    });
    const a = server.address();
    assert.ok(a && typeof a === "object");
    const base = `http://127.0.0.1:${a.port}/api`;
    assert.equal(
      (await fetch(`${base}/preview/catalog`)).status,
      enabled ? 200 : 404,
    );
    if (!enabled) continue;
    const data = (await (
      await fetch(`${base}/preview/catalog?kind=event&q=navratri`)
    ).json()) as { demo: boolean; total: number; items: CatalogRecord[] };
    assert.equal(data.demo, true);
    assert.equal(data.total, 1);
    assert.equal(data.items[0]!.location.placeId, "LAW-431");
    for (const query of ["kind=oops", "q=a&q=b", "unknown=1"])
      assert.equal(
        (await fetch(`${base}/preview/catalog?${query}`)).status,
        400,
      );
    assert.equal(
      (await fetch(`${base}/preview/catalog?dataVersion=wrong`)).status,
      409,
    );
    assert.equal((await fetch(`${base}/preview/catalog/missing`)).status, 404);
    assert.equal((await fetch(`${base}/events`)).status, 501);
    const response = await fetch(`${base}/preview/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatRequest({ dataVersion: "prototype-v1" })),
    });
    assert.equal(response.status, 501);
    assert.equal(
      ((await response.json()) as { error: { code: string } }).error.code,
      "FEATURE_DISABLED",
    );
  }
});
test("provider receives bounded retrieved records as reference data", async () => {
  let captured: any;
  const adapter = new OpenAIIntentAdapter(
    {
      responses: {
        create: async (body: unknown) => {
          captured = body;
          return {
            status: "completed",
            output: [],
            output_text: JSON.stringify(
              intent({ kind: "find_place", query: "WRIT 340" }),
            ),
          };
        },
      },
    } as unknown as Pick<OpenAI, "responses">,
    "test-model",
  );
  await adapter.interpret(scope(), chatRequest(), [demoRecords[1]!]);
  const input = JSON.parse(captured.input[0].content);
  assert.equal(input.retrievedRecords[0].id, "demo-writ-340");
  assert.equal(input.retrievedRecords[0].source.official, false);
  assert.equal(captured.store, false);
});
