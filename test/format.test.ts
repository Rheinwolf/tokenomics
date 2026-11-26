// Sample-data checks for the formatter. Run: node --test test/format.test.ts
import assert from 'node:assert/strict'
import { baseName, duration, modelName, segments } from '../hooks/format.ts'

const now = Date.parse('2026-11-26T12:00:00Z')
const show = (name: string, s: ReturnType<typeof segments>) =>
  console.log(`\n[${name}]\n  ` + s.map(x => x.text).join('  ·  '))

// Subscription
const sub = segments({
  now, startedAt: now - 90 * 60000, costUsd: 4.371, detail: 'normal',
  rateLimits: [
    { kind: 'five_hour', percentUsed: 41, resetsAt: '2026-11-26T13:59:30Z' },
    { kind: 'seven_day', percentUsed: 17, resetsAt: '2026-11-29T23:00:30Z' },
  ],
  contextPercent: 38, model: 'claude-opus-5-5', project: 'LottoLabor', branch: 'main', dirty: true,
})
show('subscription, normal', sub)
assert.equal(sub[0].text, 'API value this session: $4.37 · covered by subscription')
assert.equal(sub[1].text, '5h limit 41% · resets in 1h59m')
assert.equal(sub[2].text, '7d limit 17% · resets in 3d11h')
assert.ok(sub.some(s => s.text === 'LottoLabor · main ✗'))
assert.ok(sub.some(s => s.text === '1h30m'))

// API billing, warnings, full, EUR
const api = segments({
  now, startedAt: now - 5 * 60000, costUsd: 4.37, detail: 'full', currency: 'EUR', rate: 0.92,
  rateLimits: [], contextPercent: 85, model: 'claude-sonnet-5-5', project: 'x', added: 120, removed: 30,
})
show('api, full, EUR', api)
assert.equal(api[0].text, 'API cost this session: $4.37 (≈ 4.02 EUR @ 0.92)')
assert.equal(api.find(s => s.key === 'context')!.text, '▲ context 85%')
assert.equal(api.find(s => s.key === 'context')!.level, 'alert')
assert.ok(api.some(s => s.text === '+120 / −30 lines'))

// Limit thresholds
const warn = segments({ now, detail: 'compact', rateLimits: [{ kind: 'five_hour', percentUsed: 65 }, { kind: 'seven_day', percentUsed: 80 }] })
show('thresholds, compact', warn)
assert.equal(warn[0].level, 'warn'); assert.equal(warn[0].text, '△ 5h limit 65%')
assert.equal(warn[1].level, 'alert')

// Missing values: nothing invented
const empty = segments({ now, detail: 'full', rateLimits: [] })
show('missing everything', empty)
assert.equal(empty.length, 0)
const nan = segments({ now, detail: 'normal', costUsd: NaN, contextPercent: undefined, rateLimits: [{ kind: 'five_hour', percentUsed: NaN }] })
assert.equal(nan.length, 0)

// Windows paths and helpers
assert.equal(baseName(String.raw`C:\Users\someone\Projects\LottoLabor`), 'LottoLabor')
assert.equal(baseName(String.raw`C:\Users\someone\Projects\LottoLabor\ `.trim()), 'LottoLabor')
assert.equal(baseName('/home/a/proj'), 'proj')
assert.equal(modelName('claude-opus-5-5'), 'Opus 5.5')
assert.equal(modelName('claude-haiku-5-5[1m]'), 'Haiku 5.5')
assert.equal(modelName('gpt-x'), 'gpt-x')
assert.equal(duration(30000), '<1m'); assert.equal(duration(-5), '')
console.log('\nAll checks passed.')

// Traffic light: up to 50 % green, up to 75 % yellow, above red
import { trafficLight } from '../hooks/format.ts'
assert.equal(trafficLight(0), 'good'); assert.equal(trafficLight(50), 'good')
assert.equal(trafficLight(50.5), 'warn'); assert.equal(trafficLight(75), 'warn')
assert.equal(trafficLight(75.5), 'alert'); assert.equal(trafficLight(100), 'alert')
console.log('Traffic light checks passed.')

import { parseNumstat } from '../hooks/format.ts'
assert.deepEqual(parseNumstat('12\t3\ta.ts\n-\t-\timg.png\n5\t0\tb.ts\n'), { added: 17, removed: 3 })
assert.deepEqual(parseNumstat(''), { added: 0, removed: 0 })
console.log('Numstat checks passed.')

// Changed files and ECB rates
import { parseChanges, parseEcbRate } from '../hooks/format.ts'
const files = parseChanges('3\t1\tsmall.ts\n40\t10\tbig.ts\n-\t-\tlogo.png\n', ' M big.ts\n?? new file.md\n?? "quoted.md"\n')
assert.deepEqual(files.map(f => f.path), ['big.ts', 'small.ts', 'logo.png', 'new file.md', 'quoted.md'])
assert.equal(files[0].added, 40); assert.equal(files[2].isBinary, true); assert.equal(files[3].isNew, true)
assert.deepEqual(parseChanges('', ''), [])

const ecb = `<gesmes:Envelope><Cube><Cube time='2026-11-26'>
  <Cube currency='USD' rate='1.0500'/><Cube currency='GBP' rate='0.8400'/><Cube currency='CHF' rate='0.9450'/>
</Cube></Cube></gesmes:Envelope>`
assert.deepEqual(parseEcbRate(ecb, 'EUR'), { rate: 0.9524, date: '2026-11-26' })
assert.deepEqual(parseEcbRate(ecb, 'GBP'), { rate: 0.8, date: '2026-11-26' })
assert.deepEqual(parseEcbRate(ecb, 'CHF'), { rate: 0.9, date: '2026-11-26' })
assert.equal(parseEcbRate(ecb, 'XYZ'), null)
assert.equal(parseEcbRate('<html>error</html>', 'EUR'), null)

const live = segments({ now, costUsd: 10, detail: 'full', rateLimits: [], currency: 'EUR', rate: 0.9524, rateSource: 'ECB 2026-11-26' })
assert.equal(live[0].text, 'API cost this session: $10.00 (≈ 9.52 EUR · ECB 2026-11-26)')
const normalLines = segments({ now, detail: 'normal', rateLimits: [], project: 'p', added: 5, removed: 2 })
assert.ok(normalLines.some(s => s.text === '+5 / −2 lines'), 'lines show in normal mode')
console.log('Changes and ECB checks passed.')

const noResets = segments({ now, detail: 'full', resets: false, rateLimits: [{ kind: 'five_hour', percentUsed: 20, resetsAt: '2026-11-26T13:00:00Z' }] })
assert.equal(noResets[0].text, '5h limit 20%')
console.log('Resets switch checks passed.')
