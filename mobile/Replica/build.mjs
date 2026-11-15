import {build} from 'esbuild'
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'

const repo=fileURLToPath(new URL('../../',import.meta.url))
const output=new URL('../TrojanCompass/Resources/Replica/',import.meta.url)
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8')
mkdirSync(new URL('campus/',output),{recursive:true})
mkdirSync(new URL('interior/',output),{recursive:true})
cpSync(repo+'/apps/campus-demo/assets',fileURLToPath(new URL('campus/assets',output)),{recursive:true})
cpSync(repo+'/apps/campus-demo/demo.css',fileURLToPath(new URL('campus/demo.css',output)))
cpSync(repo+'/apps/web/public/images',fileURLToPath(new URL('images',output)),{recursive:true})
cpSync(fileURLToPath(new URL('fonts/',import.meta.url)),fileURLToPath(new URL('fonts/',output)),{recursive:true})

// Preserve the saved campus DOM, branding, CSS, tiles, credits, and behavior.
const campus=read('apps/campus-demo/index.html').replace('<script src="demo.js" type="module"></script>','<script src="campus.js"></script>')
writeFileSync(new URL('campus/index.html',output),campus)
const locations=read('apps/campus-demo/locations.json')
await build({absWorkingDir:repo,entryPoints:['apps/campus-demo/demo.js'],bundle:true,format:'iife',target:'safari17',minify:true,
  outfile:fileURLToPath(new URL('campus/campus.js',output)),plugins:[{name:'offline-directory',setup(b){
    b.onLoad({filter:/campus-demo\/demo\.js$/},({path})=>({loader:'js',contents:readFileSync(path,'utf8')
      .replace("const response = await fetch('./locations.json')",`const response = {ok:true,json:async()=>(${locations})}`)
      .replace('input.value = window.location.href', "input.value = 'trojancompass://map?campus=1'")}))
  }}]})

const model='data:model/gltf-binary;base64,'+readFileSync(repo+'/apps/web/public/models/tommy-trojan.glb').toString('base64')
const dances=read('apps/web/public/models/trojan-dances.json')
await build({absWorkingDir:repo,entryPoints:['mobile/Replica/interior.tsx'],bundle:true,format:'iife',target:'safari17',jsx:'automatic',minify:true,
  tsconfig:'apps/web/tsconfig.json',define:{'process.env.NODE_ENV':'"production"'},
  outfile:fileURLToPath(new URL('interior/interior.js',output)),plugins:[{name:'standalone-web-screen',setup(b){
    b.onLoad({filter:/components\/Wayfinder\.tsx$/},({path})=>({loader:'tsx',contents:readFileSync(path,'utf8')
      .replace("import dynamic from 'next/dynamic'", "import { MapCanvas } from './map/MapCanvas'")
      .replace("import { useSearchParams } from 'next/navigation'",'const useSearchParams = () => new URLSearchParams(window.location.search)')
      .replace(/const MapCanvas = dynamic\([\s\S]*?\n\}\)\n/,'')}))
    b.onLoad({filter:/components\/ui\/Header\.tsx$/},({path})=>({loader:'tsx',contents:readFileSync(path,'utf8')
      .replace("import Image from 'next/image'",'const Image = ({priority, ...props}: any) => <img {...props} />')}))
    b.onLoad({filter:/TommyTrojanModel\.tsx$/},({path})=>({loader:'tsx',contents:readFileSync(path,'utf8')
      .replace(/'\/models\/tommy-trojan\.glb\?[^']*'/,JSON.stringify(model))
      .replace(/fetch\('\/models\/trojan-dances\.json\?[^']*'\)/,`Promise.resolve({ok:true,json:async()=>(${dances})})`)}))
  }}]})
execFileSync('npx',['@tailwindcss/cli','-i','mobile/Replica/replica.css','-o','mobile/TrojanCompass/Resources/Replica/interior/interior.css','--minify'],{cwd:repo,stdio:'inherit'})
writeFileSync(new URL('interior/index.html',output),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#990000"><title>Trojan Compass · USC Campus Maps</title><link rel="stylesheet" href="../fonts/fonts.css"><link rel="stylesheet" href="interior.css"></head><body><a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-3">Skip to content</a><div id="root"></div><script src="interior.js"></script></body></html>`)
writeFileSync(new URL('source.json',output),JSON.stringify({reference:'trojan-compass-main (1).zip',referenceCommit:'c04a38a332bcdd89cc0d8c5d0624c628a1750b07',campusHTMLSHA256:createHash('sha256').update(read('apps/campus-demo/index.html')).digest('hex'),description:'Original web UI bundled for Swift, with adapted Next.js loading and automatic search dismissal after successful results.'},null,2)+'\n')
console.log('Bundled original campus and interior UI, logo, fonts, tiles, model, and dances.')
