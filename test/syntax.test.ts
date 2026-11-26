// Parses every hooks file, so a syntax error is caught before the app refuses the mod.
// Run: node --test test/syntax.test.ts
import { readFileSync, readdirSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const dir = new URL('../hooks/', import.meta.url)
for (const f of readdirSync(dir).filter(n => n.endsWith('.ts'))) {
  stripTypeScriptTypes(readFileSync(new URL(f, dir), 'utf8'))
  console.log(`parsed ${f}`)
}
console.log('Syntax checks passed.')
