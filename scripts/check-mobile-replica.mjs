import assert from 'node:assert/strict'
import {readFileSync,existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'

const root = fileURLToPath(new URL('../',import.meta.url))
const bundle = root+'mobile/TrojanCompass/Resources/Replica/'
const original=readFileSync(root+'apps/campus-demo/index.html','utf8')
const copy=readFileSync(bundle+'campus/index.html','utf8')
assert.equal(copy,original.replace('<script src="demo.js" type="module"></script>','<script src="campus.js"></script>'))
assert.deepEqual(readFileSync(bundle+'images/usc-monogram.png'),readFileSync(root+'apps/web/public/images/usc-monogram.png'))
assert.deepEqual(readFileSync(bundle+'campus/demo.css'),readFileSync(root+'apps/campus-demo/demo.css'))
for(const m of copy.matchAll(/(?:src|href)="\.\/([^"#?]+)(?:[^\"]*)"/g)){
    assert.ok(existsSync(bundle+'campus/'+m[1]),'Missing campus asset: '+m[1])
}
const css=readFileSync(bundle+'fonts/fonts.css','utf8')
assert.ok(css.includes('Source Sans 3') && css.includes('Source Serif 4'))
for(const m of css.matchAll(/url\(([^)]+)\)/g)) assert.ok(existsSync(bundle+m[1].replace(/^\//,'')))
const interior=readFileSync(bundle+'interior/interior.js','utf8')
for(const text of ['Search rooms','Search & tools','Map layers','data:model/gltf-binary;base64,']) assert.ok(interior.includes(text),'Missing original screen/asset: '+text)
assert.ok(!interior.includes("fetch('/models/"),'Model assets must load offline')
assert.ok(readFileSync(bundle+'campus/campus.js','utf8').includes('trojancompass://map?campus=1'))
const source=JSON.parse(readFileSync(bundle+'source.json','utf8'))
assert.equal(source.campusHTMLSHA256,createHash('sha256').update(original).digest('hex'))
console.log('Original campus HTML/CSS/logo, local assets/fonts, interior UI, and source provenance checks passed.')
