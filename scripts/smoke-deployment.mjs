// Run after npm run build, with private port 4000 available. No live AI requests.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://localhost:${port}`;
const launcher = spawn(process.execPath, ["scripts/start.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    PORT: String(port),
    API_BASE_URL: process.env.API_BASE_URL ?? "http://127.0.0.1:4000",
    PUBLIC_APP_URL: base,
    REPLIT_DEV_DOMAIN: "",
    REPLIT_DEPLOYMENT: "",
    DATASET_ROOT: fileURLToPath(
      new URL("../server/data/snapshots/", import.meta.url),
    ),
    DATASET_MODE: "files",
    CURSOR_SECRET: "deployment-smoke-only-secret-at-least-32-bytes",
    ALLOW_DEMO_DATA: "true",
    AI_PROVIDER: "disabled",
    CORS_ORIGINS: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
launcher.stdout.on("data", (chunk) => {
  logs += chunk;
});
launcher.stderr.on("data", (chunk) => {
  logs += chunk;
});
const exited = once(launcher, "exit");
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    assert.equal(launcher.exitCode, null, logs);
    try {
      ready = (
        await fetch(base + "/api/health", { signal: AbortSignal.timeout(1000) })
      ).ok;
    } catch {
      /* The real production processes are still starting. */
    }
    if (ready) break;
    await delay(200);
  }
  assert.ok(ready, logs);
  const campus = await fetch(base);
  assert.equal(new URL(campus.url).pathname, "/campus/index.html");
  const html = await campus.text();
  for (const match of html.matchAll(
    /(?:src|href)="\.\/([^"#?]+)(?:[^\"]*)"/g,
  )) {
    const asset = await fetch(base + "/campus/" + match[1]);
    assert.equal(asset.status, 200, match[1]);
    await asset.arrayBuffer();
  }
  for (const path of [
    "/?building=LAW&floor=1",
    "/favicon.png",
    "/images/usc-monogram.png",
    "/campus/locations.json",
    "/campus/map-data.js",
  ]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    await response.arrayBuffer();
  }
  const response = await fetch(base + "/api/buildings/LAW");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const { building, dataVersion } = await response.json();
  assert.equal(new URL(building.viewerUrl).origin, base);
  assert.equal(building.provenance.verificationStatus, "unverified");
  assert.equal(building.capabilities.chatText, false);
  const { scene } = await (
    await fetch(base + `/api/buildings/LAW/scene?dataVersion=${dataVersion}`)
  ).json();
  for (const floor of scene.floors) {
    assert.equal(new URL(floor.geometryUrl).origin, base);
    const geometry = await fetch(floor.geometryUrl);
    assert.equal(geometry.status, 200);
    await geometry.arrayBuffer();
  }
  const route = await fetch(base + "/api/routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientRequestId: crypto.randomUUID(),
      dataVersion,
      origin: { kind: "place", buildingId: "LAW", placeId: "LAW-101" },
      destination: { kind: "place", buildingId: "LAW", placeId: "LAW-107" },
      mode: "fastest",
      stepFree: false,
      accessProfile: "public",
    }),
  });
  assert.equal(route.status, 200, await route.clone().text());
  assert.ok((await route.json()).route.distanceMeters > 0);
  console.log(
    "Deployment smoke passed: real launcher, campus assets, interior, hosted geometry URLs, HTTP protections, demo provenance, route and disabled AI.",
  );
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  if (launcher.exitCode === null) {
    if (process.platform === "win32")
      execFileSync("taskkill", ["/pid", String(launcher.pid), "/T", "/F"], {
        stdio: "ignore",
      });
    else launcher.kill("SIGTERM");
  }
  await exited;
}
