import { build } from 'esbuild'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const out = new URL('../TrojanCompass/Resources/Viewer/', import.meta.url)
execFileSync(process.execPath, ['--import', 'tsx', 'mobile/Viewer/export-catalog.ts'], {cwd: root, stdio: 'inherit'})
const model = 'data:model/gltf-binary;base64,' + readFileSync(new URL('../../apps/web/public/models/tommy-trojan.glb', import.meta.url)).toString('base64')
const dances = readFileSync(new URL('../../apps/web/public/models/trojan-dances.json', import.meta.url), 'utf8')
await build({
  absWorkingDir: root, entryPoints: ['mobile/Viewer/viewer.tsx'], bundle: true,
  outfile: fileURLToPath(new URL('viewer.js', out)), minify: true,
  target: 'safari17', format: 'iife', jsx: 'automatic', define: {'process.env.NODE_ENV': '"production"'},
  plugins: [{name:'bundled-trojan', setup(b) {
    b.onLoad({filter: /TommyTrojanModel\.tsx$/}, async ({path}) => ({
      contents: readFileSync(path,'utf8').replace(/'\/models\/tommy-trojan\.glb\?[^']*'/, JSON.stringify(model))
        .replace(/fetch\('\/models\/trojan-dances\.json\?[^']*'\)/, `Promise.resolve({ok:true,json:async()=>(${dances})})`)
        .replace("if (!carried || !action)", "if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !carried || !action)"), loader:'tsx'
    }))
    b.onLoad({filter: /RouteLine\.tsx$/}, async ({path}) => ({
      contents: readFileSync(path,'utf8').replace(/useFrame\((\([^)]*\)) => \{/g, "useFrame($1 => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;"), loader:'tsx'
    }))
    b.onLoad({filter: /TommyTrojan\.tsx$/}, async ({path}) => ({
      contents: readFileSync(path,'utf8')
        .replace('const state = fall.current', "if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (body.current) body.current.position.y = 0; return }; const state = fall.current")
        .replace('advanceCarrySwing(swing.current,', "if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) advanceCarrySwing(swing.current,"), loader:'tsx'
    }))
    b.onLoad({filter: /MapCanvas\.tsx$/}, async ({path}) => ({
      contents: readFileSync(path,'utf8').replace('controls.setLookAt(...fitted.position.toArray(), ...fitted.target.toArray(), animate)', "controls.setLookAt(...fitted.position.toArray(), ...fitted.target.toArray(), animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)")
        .replace('smoothTime={0.45}', "smoothTime={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.45}"), loader:'tsx'
    }))
  }}]
})
// Generate only the Tailwind utilities actually used by the embedded scene.
execFileSync('npx', ['@tailwindcss/cli', '-i', 'mobile/Viewer/viewer.css', '-o', 'mobile/TrojanCompass/Resources/Viewer/viewer.css', '--minify'], {cwd: root, stdio:'inherit'})
writeFileSync(new URL('index.html',out), `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><title>Trojan Compass Interior</title><link rel="stylesheet" href="viewer.css"></head><body><div id="root"></div><script src="viewer.js"></script></body></html>`)
console.log('Bundled offline viewer and preview catalog.')
