import { loadSnapshots } from "./infrastructure/datasets/snapshot-loader.js";
import { createServices, prepareServices } from "./bootstrap/services.js";
import { DisabledIntentAdapter } from "./integrations/ai/provider-adapter.js";
if (![undefined, "true", "false"].includes(process.env.ALLOW_DEMO_DATA))
  throw new Error("ALLOW_DEMO_DATA must be true or false.");
const directory = process.argv[2] ?? process.env.DATASET_ROOT;
if (!directory)
  throw new Error("Pass an absolute snapshot directory or set DATASET_ROOT.");
const store = await loadSnapshots(directory, {
  production: process.env.NODE_ENV === "production",
  allowDemoData: process.env.ALLOW_DEMO_DATA === "true",
  chatEnabled: false,
});
const services = createServices(
  store,
  () => store.currentVersion,
  "validation-only-cursor-secret-never-served",
  new DisabledIntentAdapter(),
);
await prepareServices(services, store.versions());
process.stdout.write(
  JSON.stringify({
    valid: true,
    currentVersion: store.currentVersion,
    availableVersions: store.versions(),
  }) + "\n",
);
