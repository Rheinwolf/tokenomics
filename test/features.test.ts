// Cost warning, today's total, cost per line and the limit notice.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addToDay, costLevel, dayTotal, limitAlerts, limitNotice, localDay, parseThresholds, segments } from '../hooks/format.ts'
import { LANGS } from '../hooks/lang.ts'

const now = Date.parse('2026-11-26T12:00:00Z')
const cost = (c: number, warn?: number | null, alert?: number | null) =>
  segments({ now, detail: 'full', costUsd: c, costWarn: warn, costAlert: alert, rateLimits: [] })[0]

test('cost warning thresholds', () => {
  assert.equal(cost(5, 10, 25).level, 'ok')
  assert.equal(cost(12, 10, 25).level, 'warn')
  assert.match(cost(12, 10, 25).text, /^△ API cost/)
  assert.equal(cost(30, 10, 25).level, 'alert')
  assert.match(cost(30, 10, 25).text, /^▲ API cost/)
  assert.equal(cost(30).level, 'ok', 'no thresholds, no warning')
  assert.equal(costLevel(30, 10, null), 'warn')
})

test('parsing typed thresholds', () => {
  assert.deepEqual(parseThresholds('$10 / $25'), { warn: 10, alert: 25 })
  assert.deepEqual(parseThresholds('5/20'), { warn: 5, alert: 20 })
  assert.deepEqual(parseThresholds('2,5 10'), { warn: 2.5, alert: 10 })
  assert.deepEqual(parseThresholds('8'), { warn: 8, alert: null })
  for (const bad of ['', 'none', '25/10', '1/2/3', undefined]) assert.equal(parseThresholds(bad), null, String(bad))
})

test("today's total", () => {
  const day = localDay(now)
  let log = addToDay(null, day, 'a', 3)
  log = addToDay(log, day, 'b', 2)
  log = addToDay(log, day, 'a', 4) // same session grows, not added twice
  assert.equal(dayTotal(log, day), 6)
  assert.deepEqual(addToDay(log, '2026-11-27', 'c', 1).sessions, { c: 1 }, 'a new day starts empty')
  assert.deepEqual(addToDay({ day, sessions: { x: 'junk', y: -1, z: 2 } }, day, 'a', 1).sessions, { z: 2, a: 1 })
  assert.equal(dayTotal(log, '2026-11-27'), undefined)
  const s = segments({ now, detail: 'full', costUsd: 4, todayUsd: 6, rateLimits: [] })
  assert.ok(s.some(x => x.text === 'today $6.00'))
  const single = segments({ now, detail: 'full', costUsd: 4, todayUsd: 4, rateLimits: [] })
  assert.ok(!single.some(x => x.key === 'today'), 'hidden while there is only this session')
})

test('cost per changed line', () => {
  const s = segments({ now, detail: 'full', costUsd: 3, rateLimits: [], project: 'p', added: 120, removed: 30 })
  assert.ok(s.some(x => x.text === '$0.02 / line'))
  const tiny = segments({ now, detail: 'full', costUsd: 0.05, rateLimits: [], project: 'p', added: 900, removed: 100 })
  assert.ok(tiny.some(x => x.text === '$0.0001 / line'))
  const none = segments({ now, detail: 'full', costUsd: 3, rateLimits: [], project: 'p', added: 0, removed: 0 })
  assert.ok(!none.some(x => x.key === 'perline'))
})

test('limit notice once per reset period', () => {
  const l = { kind: 'five_hour', percentUsed: 78, resetsAt: '2026-11-26T13:20:00Z' }
  const first = limitAlerts([l], {})
  assert.equal(first.alerts.length, 1)
  assert.equal(limitAlerts([l], first.seen).alerts.length, 0, 'not twice')
  assert.equal(limitAlerts([{ ...l, resetsAt: '2026-11-26T18:20:00Z' }], first.seen).alerts.length, 1, 'again after reset')
  assert.equal(limitAlerts([{ ...l, percentUsed: 75 }], {}).alerts.length, 0)
  assert.equal(limitAlerts([{ ...l, percentUsed: NaN }], {}).alerts.length, 0)
  assert.equal(limitNotice(l, now), '▲ 5h limit 78% · resets in 1h20m')
})

test('every language has the new setup texts', () => {
  for (const l of LANGS) {
    for (const k of ['s5', 's5none', 's6', 'costWarn', 'alerts'] as const) assert.ok(l.t[k], `${l.code}.${k}`)
    for (const k of ['today', 'perline'] as const) {
      assert.ok(l.t.items[k], `${l.code}.items.${k}`)
      assert.ok(l.t.names[k], `${l.code}.names.${k}`)
    }
  }
})
