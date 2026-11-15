// Temporary bridge: keep the demo usable until it consumes the shared API.
// Copy only the allowlisted pure prototype modules, never arbitrary server code.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('./legacy-browser-manifest.json', import.meta.url), 'utf8'));
const targets = new Map(manifest.map(({ source, target }) => [resolve(root, source), resolve(root, target)]));
const check = process.argv.includes('--check');
let stale = 0;

for (const { source, target } of manifest) {
  const sourcePath = resolve(root, source);
  const targetPath = resolve(root, target);
  const original = await readFile(sourcePath, 'utf8');
  const body = original.replace(/from '([^']+)'/g, (_, specifier) => {
    const dependency = resolve(dirname(sourcePath), specifier.replace(/\.js$/, '.ts'));
    const browserDependency = targets.get(dependency);
    if (!browserDependency) throw new Error(`Non-allowlisted dependency in ${source}: ${specifier}`);
    let spec = relative(dirname(targetPath), browserDependency).replaceAll('\\', '/');
    spec = spec.slice(0, -extname(spec).length);
    if (!spec.startsWith('.')) spec = `./${spec}`;
    return `from '${spec}'`;
  });
  const expected = `// GENERATED from ${source}\n// Run npm run sync:legacy after editing the source. Do not edit this copy.\n${body}`;
  let actual;
  try { actual = await readFile(targetPath, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (actual === expected) continue;
  if (check) {
    console.error(`Stale browser compatibility copy: ${target}`);
    stale++;
  } else {
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, expected);
  }
}
if (stale) {
  console.error('Run npm run sync:legacy and include the regenerated files.');
  process.exitCode = 1;
} else {
  console.log(check ? 'Browser compatibility copies are current.' : 'Browser compatibility copies synchronized.');
}
