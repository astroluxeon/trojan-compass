import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { readConfig } from "../server/dist/config/env.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";
const apiPort = /^http:\/\/127\.0\.0\.1:(\d+)$/.exec(apiBase)?.[1];
if (!apiPort || Number(apiPort) < 1 || Number(apiPort) > 65535)
  throw new Error(
    "API_BASE_URL must use http://127.0.0.1 and a valid private port.",
  );
const port = process.env.PORT ?? "3000";
if (
  !/^\d+$/.test(port) ||
  Number(port) < 1 ||
  Number(port) > 65535 ||
  Number(port) === Number(apiPort)
)
  throw new Error("PORT must be 1–65535 and differ from the private API port.");
const { rewrites } = JSON.parse(
  readFileSync(
    new URL("../web/.next/routes-manifest.json", import.meta.url),
    "utf8",
  ),
);
const rules = Array.isArray(rewrites)
  ? rewrites
  : Object.values(rewrites).flat();
if (
  !rules.some(
    (rule) =>
      rule.source === "/api/:path*" &&
      rule.destination === `${apiBase}/api/:path*`,
  )
)
  throw new Error(
    "API_BASE_URL differs from the web build. Rebuild with the same API_BASE_URL used at runtime.",
  );
const publicUrl = new URL(
  !process.env.REPLIT_DEPLOYMENT && process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : (process.env.PUBLIC_APP_URL ?? `http://localhost:${port}`),
);
if (
  !["http:", "https:"].includes(publicUrl.protocol) ||
  publicUrl.username ||
  publicUrl.password ||
  publicUrl.pathname !== "/" ||
  publicUrl.search ||
  publicUrl.hash
)
  throw new Error(
    "PUBLIC_APP_URL must be an HTTP(S) origin without credentials, path, query or fragment.",
  );
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATASET_ROOT:
    process.env.DATASET_ROOT ??
    fileURLToPath(new URL("../server/data/snapshots/", import.meta.url)),
  VIEWER_BASE_URL: publicUrl.origin,
  PUBLIC_API_BASE_URL: publicUrl.origin,
  CORS_ORIGINS:
    process.env.CORS_ORIGINS ??
    (publicUrl.protocol === "https:" ? publicUrl.origin : ""),
  TRUST_PROXY_CIDRS: process.env.TRUST_PROXY_CIDRS ?? "127.0.0.1/32,::1/128",
};
readConfig({ ...env, PORT: apiPort, HOST: "127.0.0.1" });

const children = [];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => {
    for (const child of children)
      if (child.exitCode === null) child.kill("SIGKILL");
  }, 12000).unref();
}
function start(args, childEnv) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: childEnv,
    stdio: "inherit",
  });
  children.push(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping) stop(code || 1);
  });
}
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => stop(0));

try {
  start(["server/dist/server.js"], {
    ...env,
    PORT: apiPort,
    HOST: "127.0.0.1",
  });
  let ready = false;
  for (let attempt = 0; attempt < 100 && !stopping; attempt++) {
    try {
      ready = (
        await fetch(`${apiBase}/api/health`, {
          signal: AbortSignal.timeout(1000),
        })
      ).ok;
    } catch {
      /* Wait for dataset validation before exposing the web app. */
    }
    if (ready) break;
    await delay(200);
  }
  if (!ready || stopping)
    throw new Error("Private API failed to become ready.");
  start(
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "web",
      "--hostname",
      "0.0.0.0",
      "--port",
      port,
    ],
    env,
  );
} catch (error) {
  console.error(error.message);
  stop(1);
}
