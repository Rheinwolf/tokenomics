// Every place that names the version must name the same one. Run: node --test test/version.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { VERSION, EXPLAIN_LANGS } from '../hooks/explain.ts'
import { LANGS } from '../hooks/lang.ts'

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const plugin = JSON.parse(read('.claude-plugin/plugin.json')).version
const market = JSON.parse(read('.claude-plugin/marketplace.json')).plugins[0].version
const readme = /\*\*Version ([0-9.]+)\*\*/.exec(read('README.md'))?.[1]
const changelog = /^## ([0-9.]+)/m.exec(read('CHANGELOG.md'))?.[1]

for (const [where, v] of Object.entries({ 'plugin.json': plugin, 'marketplace.json': market, 'README.md': readme, 'CHANGELOG.md': changelog })) {
  assert.equal(v, VERSION, `${where} says ${v}, explain.ts says ${VERSION}`)
}
for (const m of read('README.md').matchAll(/Tokenomics ([0-9]+[.][0-9]+[.][0-9]+)/g)) assert.equal(m[1], VERSION, `README example says Tokenomics ${m[1]}`)
for (const l of LANGS) assert.ok(EXPLAIN_LANGS.includes(l.code), `no explain text for ${l.code}`)
console.log(`Version ${VERSION} is the same everywhere; explain covers all ${LANGS.length} languages.`)
