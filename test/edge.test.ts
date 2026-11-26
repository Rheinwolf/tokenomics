// Edge cases: broken, odd or extreme input must never crash and never invent values.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  baseName, duration, money, parseChanges, parseEcbRate, parseNumstat, parseRate, segments, trafficLight,
} from '../hooks/format.ts'

const now = Date.parse('2026-11-26T12:00:00Z')
const text = (s: ReturnType<typeof segments>) => s.map(x => x.text)

test('negative, NaN and infinite numbers are left out', () => {
  for (const bad of [NaN, -1, Infinity, -Infinity]) {
    const s = segments({ now, detail: 'full', costUsd: bad, contextPercent: bad, rateLimits: [{ kind: 'five_hour', percentUsed: bad }] })
    assert.ok(!text(s).some(t => /NaN|Infinity|\$-/.test(t)), `no garbage for ${bad}: ${text(s)}`)
  }
  assert.equal(duration(NaN), '')
  assert.equal(duration(-1000), '')
})

test('limits above 100 % stay red and readable', () => {
  assert.equal(trafficLight(130), 'alert')
  const s = segments({ now, detail: 'compact', rateLimits: [{ kind: 'five_hour', percentUsed: 130 }] })
  assert.equal(s[0].level, 'alert')
  assert.match(s[0].text, /^▲ 5h limit \d+%$/)
})

test('large costs and decimal separators', () => {
  assert.equal(money(0), '$0.00')
  assert.match(money(12345.678), /^\$12,?345\.68$/)
  assert.equal(parseRate('0,92'), 0.92)
  assert.equal(parseRate(' 1.5 '), 1.5)
  for (const bad of ['', 'abc', '-1', '0', '1.000,50', undefined, 3]) assert.equal(parseRate(bad), undefined, String(bad))
})

test('broken git output', () => {
  assert.deepEqual(parseNumstat('garbage\n\t\n12\tx\tfile\n\r\n3\t4\tok.ts\r\n'), { added: 15, removed: 4 })
  assert.deepEqual(parseChanges('no tabs here\n5\t1\t\n', 'XY\n?? \n'), [])
  const cut = parseChanges('7\t2\tcut-off', '')
  assert.equal(cut[0].path, 'cut-off')
})

test('unicode project and file names', () => {
  assert.equal(baseName(String.raw`C:\Users\x\Projekte\Größe-日本`), 'Größe-日本')
  assert.equal(baseName('/home/x/проект/'), 'проект')
  const files = parseChanges('1\t0\tdocs/über.md\n', '?? 新しい.ts\n')
  assert.deepEqual(files.map(f => f.path), ['docs/über.md', '新しい.ts'])
  const s = segments({ now, detail: 'full', rateLimits: [], project: 'Größe-日本', branch: 'feature/ü' })
  assert.ok(text(s).includes('Größe-日本 · feature/ü'))
})

test('ECB data that is incomplete or malformed', () => {
  const noDate = `<Cube currency='USD' rate='1.05'/><Cube currency='GBP' rate='0.84'/>`
  assert.equal(parseEcbRate(noDate, 'GBP'), null)
  const noUsd = `<Cube time='2026-11-26'><Cube currency='GBP' rate='0.84'/></Cube>`
  assert.equal(parseEcbRate(noUsd, 'GBP'), null)
  const zero = `<Cube time='2026-11-26'><Cube currency='USD' rate='0'/><Cube currency='GBP' rate='0.84'/></Cube>`
  assert.equal(parseEcbRate(zero, 'GBP'), null)
  assert.equal(parseEcbRate('', 'EUR'), null)
  assert.equal(parseEcbRate(`<Cube time='2026-11-26'><Cube currency='USD' rate='1.05'/></Cube>`, 'G.P'), null)
})
