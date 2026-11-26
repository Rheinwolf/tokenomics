// Pure formatting helpers: no engine access, easy to test.

export type Level = 'ok' | 'good' | 'warn' | 'alert'

export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Segment = {
  key: string
  text: string
  level: Level
  hint?: string
}

export type Input = {
  now: number
  startedAt?: number
  costUsd?: number
  hasUnknownPrice?: boolean
  rateLimits: readonly Limit[]
  contextPercent?: number
  model?: string
  project?: string
  branch?: string | null
  dirty?: boolean
  added?: number
  removed?: number
  detail: 'compact' | 'normal' | 'full'
  currency?: string
  rate?: number
  /** Shown instead of "@ rate" in full mode, e.g. "ECB 2026-11-26". */
  rateSource?: string
  /** false hides "resets in …" behind the limits (default: shown unless compact). */
  resets?: boolean
}

/** "1h59m", "3d11h", "42m", "<1m". */
export function duration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return ''
  const min = Math.floor(ms / 60000)
  if (min < 1) return '<1m'
  const d = Math.floor(min / 1440)
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  if (d > 0) return `${d}d${h}h`
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function money(usd: number): string {
  return `$${usd.toFixed(2)}`
}

/** Traffic light for anything that can run out: up to 50 % green, up to 75 % yellow, above red. */
export function trafficLight(p: number): Level {
  return p > 75 ? 'alert' : p > 50 ? 'warn' : 'good'
}

export const limitLevel = trafficLight
export const contextLevel = trafficLight

/** Symbol added to the text so a warning never relies on colour alone. */
export function mark(level: Level): string {
  return level === 'alert' ? '▲ ' : level === 'warn' ? '△ ' : ''
}

/** Basename of a path, Windows or POSIX. */
export function baseName(path: string): string {
  const parts = path.split(/[\\/]+/).filter(Boolean)
  return parts[parts.length - 1] ?? path
}

/** "claude-opus-5-5" -> "Opus 5.5"; anything else passes through. */
export function modelName(id: string): string {
  const m = /claude-(opus|sonnet|haiku|fable)-(\d+)(?:-(\d+))?/i.exec(id)
  if (!m) return id
  const fam = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()
  return m[3] ? `${fam} ${m[2]}.${m[3]}` : `${fam} ${m[2]}`
}

const LIMIT_LABEL: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

export function segments(i: Input): Segment[] {
  const out: Segment[] = []
  const subscription = i.rateLimits.some(l => l.kind === 'five_hour' || l.kind === 'seven_day')
  const full = i.detail === 'full'
  const compact = i.detail === 'compact'

  if (typeof i.costUsd === 'number' && Number.isFinite(i.costUsd) && i.costUsd >= 0) {
    let value = money(i.costUsd)
    if (i.currency && i.rate && i.rate > 0) {
      const rateNote = i.rateSource ? ` · ${i.rateSource}` : ` @ ${i.rate}`
      value += ` (≈ ${(i.costUsd * i.rate).toFixed(2)} ${i.currency}${full ? rateNote : ''})`
    }
    if (i.hasUnknownPrice) value += '*'
    const label = subscription
      ? compact ? 'API value' : 'API value this session'
      : compact ? 'API cost' : 'API cost this session'
    const note = subscription && !compact ? ' · covered by subscription' : ''
    const hint = subscription
      ? 'Estimate at API list prices for this session only. On a subscription this is not billed: your plan price is not subtracted, so it is not a "saving".'
      : 'Client-side estimate at API list prices for this session. Your invoice is the final authority.'
    out.push({ key: 'cost', text: `${label}: ${value}${note}`, level: 'ok', hint })
  }

  for (const l of i.rateLimits) {
    const label = LIMIT_LABEL[l.kind]
    if (!label || !Number.isFinite(l.percentUsed) || l.percentUsed < 0) continue
    const level = limitLevel(l.percentUsed)
    let text = `${mark(level)}${label} limit ${Math.round(l.percentUsed)}%`
    if (l.resetsAt && !compact && i.resets !== false) {
      const left = Date.parse(l.resetsAt) - i.now
      const d = duration(left)
      if (d) text += ` · resets in ${d}`
    }
    out.push({ key: `limit-${l.kind}`, text, level })
  }

  if (typeof i.contextPercent === 'number' && Number.isFinite(i.contextPercent) && i.contextPercent >= 0) {
    const level = contextLevel(i.contextPercent)
    out.push({ key: 'context', text: `${mark(level)}context ${Math.round(i.contextPercent)}%`, level })
  }

  if (compact) return out

  if (i.model) out.push({ key: 'model', text: modelName(i.model), level: 'ok' })

  if (i.project) {
    let text = i.project
    if (i.branch) text += ` · ${i.branch}`
    if (i.dirty) text += ' ✗'
    out.push({ key: 'repo', text, level: 'ok', hint: i.dirty ? 'Uncommitted changes' : undefined })
  }

  if (!compact && typeof i.added === 'number' && typeof i.removed === 'number' && (i.added || i.removed)) {
    out.push({
      key: 'lines',
      text: `+${i.added} / −${i.removed} lines`,
      level: 'ok',
      hint: 'Uncommitted lines in the working copy (git diff against HEAD)',
    })
  }

  if (typeof i.startedAt === 'number') {
    const d = duration(i.now - i.startedAt)
    if (d) out.push({ key: 'duration', text: d, level: 'ok' })
  }

  return out
}

export function parseRate(s: unknown): number | undefined {
  if (typeof s !== 'string' || !s.trim()) return undefined
  const n = Number(s.trim().replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Sums `git diff --numstat` output ("12<TAB>3<TAB>file"); binary files ("-") count as 0. */
export function parseNumstat(out: string): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of out.split(/\r?\n/)) {
    const [a, r] = line.split('\t')
    if (a === undefined || r === undefined) continue
    added += Number(a) || 0
    removed += Number(r) || 0
  }
  return { added, removed }
}

export type ChangedFile = { path: string; added: number; removed: number; isNew: boolean; isBinary: boolean }

/**
 * Files changed since the last commit, from `git diff --numstat HEAD` (tracked files)
 * and `git status --porcelain` (new, untracked files: lines "?? path").
 */
export function parseChanges(numstat: string, status: string): ChangedFile[] {
  const files: ChangedFile[] = []
  for (const line of numstat.split(/\r?\n/)) {
    const [a, r, ...rest] = line.split('\t')
    const path = rest.join('\t')
    if (a === undefined || r === undefined || !path) continue
    const isBinary = a === '-' && r === '-'
    files.push({ path, added: Number(a) || 0, removed: Number(r) || 0, isNew: false, isBinary })
  }
  for (const line of status.split(/\r?\n/)) {
    if (!line.startsWith('?? ')) continue
    const path = line.slice(3).replace(/^"|"$/g, '')
    if (path && !files.some(f => f.path === path)) files.push({ path, added: 0, removed: 0, isNew: true, isBinary: false })
  }
  return files.sort((x, y) => y.added + y.removed - (x.added + x.removed) || x.path.localeCompare(y.path))
}

/**
 * Reads the European Central Bank's daily reference rates (eurofxref-daily.xml, euro based)
 * and returns how much 1 USD is in `currency`, with the ECB's date. Null when missing.
 */
export function parseEcbRate(xml: string, currency: string): { rate: number; date: string } | null {
  const date = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1]
  const rateOf = (cur: string): number | null => {
    if (cur === 'EUR') return 1
    const m = new RegExp(`currency=['"]${cur}['"][\\s]+rate=['"]([0-9.]+)['"]`).exec(xml)
    const n = m ? Number(m[1]) : NaN
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const usd = rateOf('USD')
  const target = /^[A-Z]{3}$/.test(currency) ? rateOf(currency) : null
  if (!date || !usd || !target) return null
  return { rate: Math.round((target / usd) * 10000) / 10000, date }
}
