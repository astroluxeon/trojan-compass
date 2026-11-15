# Replit deployment

Use Node 22.9 or newer. Install all workspaces from the repository root with
`npm ci --include=dev`. The committed lockfile supplies the dependency versions;
there is no separate Replit dependency list.

`npm run build` copies the campus map and assets into `web/public/campus`, then
builds shared types, Express, and Next.js. `npm start` runs the production API on
`127.0.0.1:4000`, waits for it to become healthy, and starts Next.js on
`0.0.0.0:$PORT` (3000 by default). Only the Next.js port is public. The root URL
opens the campus map; `/?building=LAW&floor=1` opens an interior. `/api/*` is
proxied to Express. Keep `API_BASE_URL` unset for port 4000. If you need another
private port locally, set `API_BASE_URL=http://127.0.0.1:<port>` at both build and
runtime, and set `SMOKE_API_PORT` to the same port for `npm run smoke`. The
launcher checks that the web build targets the same private API address.

## Replit setup

The root `.replit` defines Node 22, port 3000, and production build/run commands.
Use Autoscale or Reserved VM, not a static deployment. Run builds the project
before starting Preview. Publishing installs dependencies and rebuilds it.

Set these in both project and Publishing settings as appropriate:

| Variable | Value |
| --- | --- |
| `CURSOR_SECRET` | A private random value of at least 32 bytes, stable across republishes/replicas |
| `ALLOW_DEMO_DATA` | `true` for the bundled illustrative dataset (also set in `.replit`) |
| `PUBLIC_APP_URL` | `https://trojan-compass--eddiekao01.replit.app` (also set in `.replit`; change if the deployment URL changes) |
| `AI_PROVIDER` | `disabled`, or `openai` when API access is configured |
| `OPENAI_MODEL` | `gpt-4.1-mini` when using OpenAI |
| `OPENAI_API_KEY` | A newly rotated key in Secrets only, when using OpenAI |

Generate `CURSOR_SECRET` locally with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`
and save the result in Secrets. Do not commit it. No API key is required for
maps, search, or routing. Codex subscription usage does not pay for the app's
OpenAI API calls. Rotate the key mentioned as exposed in the earlier handoff.

Preview uses `REPLIT_DEV_DOMAIN` for returned viewer and geometry URLs;
deployment uses `PUBLIC_APP_URL`. The launcher supplies the bundled dataset
path and trusts only the local Next.js proxy by default. HTTP rate limits,
origin checks, schema validation and routing validation stay enabled.

`ALLOW_DEMO_DATA=true` permits unreviewed publications; it does not make routes
verified or relax structural validation. Keep the illustrative/unverified UI
labels. Omit the flag for deployments that require reviewed data.

## Updating the existing Replit app

Save any Replit-only edits on a branch before pulling. From Replit's Shell:

```sh
git status
git fetch origin
git switch codex/replit-integration
git pull --ff-only origin codex/replit-integration
npm ci --include=dev
npm test
npm run build
npm run smoke
npm run smoke:deployment
```

Stop any running preview before smoke checks: both use private API port 4000.
The standard smoke test uses a fixed chat intent; the deployment smoke starts
the real launcher with AI disabled. Neither calls OpenAI. Do not force a pull
over divergent Replit changes; merge those changes first.

Publish, wait for Live, then check the campus, LAW interior, LAW 101 → LAW 107,
and "Find LAW 101" in chat if OpenAI is enabled. Verify production Secrets if
chat remains disabled. Replit hosting limits/billing are separate from Codex.

## Local verification

```sh
npm ci --include=dev
npm test
npm run typecheck
npm run build
npm run smoke
npm run smoke:deployment
npm run check:mobile
```

When shared web/campus sources change, regenerate mobile bundles with
`npm run build:mobile-viewer` and `npm run build:mobile-replica` before the mobile
check. Native compilation and device testing require macOS/Xcode.
