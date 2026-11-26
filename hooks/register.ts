import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { baseName, parseNumstat, parseRate, segments } from './format.ts'
import type { Segment } from './format.ts'
import { byCode, detectLanguage, ENGLISH, parseLanguage } from './lang.ts'
import type { Lang } from './lang.ts'
import { explainText, VERSION } from './explain.ts'

type Detail = 'compact' | 'normal' | 'full'
type Group = 'limits' | 'context' | 'model' | 'repo' | 'duration'
type Config = {
  detail: Detail
  currency: string
  rate: number | null
  hidden: Group[]
  isSetUp: boolean
  lang: string
}
type Repo = { project: string; branch: string | null; dirty: boolean; added: number; removed: number } | null

const DEFAULTS: Config = { detail: 'normal', currency: '', rate: null, hidden: [], isSetUp: false, lang: 'en' }
const STORE_KEY = 'config'
const ORDER: Detail[] = ['compact', 'normal', 'full']
const GROUPS: Group[] = ['limits', 'context', 'model', 'repo', 'duration']

const tick = atom({ plugin: 'tokenomics-bar', key: 'tick' } as const, 0)
const configAtom = atom({ plugin: 'tokenomics-bar', key: 'config' } as const, DEFAULTS as Config)
const repoAtom = atom({ plugin: 'tokenomics-bar', key: 'repo' } as const, null as Repo)


function groupOf(key: string): Group | null {
  if (key.startsWith('limit-')) return 'limits'
  if (key === 'context') return 'context'
  if (key === 'model') return 'model'
  if (key === 'repo' || key === 'lines') return 'repo'
  if (key === 'duration') return 'duration'
  return null
}

function sanitize(raw: unknown): Config {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<Config>
  return {
    detail: ORDER.includes(c.detail as Detail) ? (c.detail as Detail) : DEFAULTS.detail,
    currency: typeof c.currency === 'string' ? c.currency.trim().toUpperCase().slice(0, 6) : '',
    rate: typeof c.rate === 'number' && Number.isFinite(c.rate) && c.rate > 0 ? c.rate : null,
    hidden: Array.isArray(c.hidden) ? c.hidden.filter((g): g is Group => GROUPS.includes(g as Group)) : [],
    isSetUp: c.isSetUp === true,
    lang: byCode(typeof c.lang === 'string' ? c.lang : 'en').code,
  }
}

async function loadConfig($: EngineInterface): Promise<Config> {
  try {
    const config = sanitize(await $.store.get(STORE_KEY))
    await update($, configAtom, () => config)
    return config
  } catch {
    return DEFAULTS
  }
}

async function saveConfig($: EngineInterface, config: Config): Promise<void> {
  await update($, configAtom, () => config)
  try {
    await $.store.set(STORE_KEY, config)
  } catch {}
}

async function refreshRepo($: EngineInterface): Promise<void> {
  try {
    // Project + git switched off in the setup: run no git command at all.
    if ((await read($, configAtom)).hidden.includes('repo')) return
    const root = await $.session.root()
    const repo = { project: baseName(root), branch: null as string | null, dirty: false, added: 0, removed: 0 }
    // Three read-only git commands, run locally in the project folder. Nothing leaves the machine.
    const branch = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, timeoutMs: 5000 })
    if (branch.exitCode === 0) {
      repo.branch = branch.stdout.trim() || null
      const status = await $.process.run(['git', 'status', '--porcelain'], { cwd: root, timeoutMs: 5000 })
      repo.dirty = status.exitCode === 0 && status.stdout.trim().length > 0
      const numstat = await $.process.run(['git', 'diff', '--numstat', 'HEAD'], { cwd: root, timeoutMs: 5000 })
      if (numstat.exitCode === 0) {
        const counts = parseNumstat(numstat.stdout)
        repo.added = counts.added
        repo.removed = counts.removed
      }
    }
    await update($, repoAtom, () => repo)
  } catch {
    // No git or a refused call: the repo segment stays hidden.
  }
}

/** Text of the person's recent messages, for guessing their language. */
async function recentUserText($: EngineInterface): Promise<string[]> {
  try {
    const r: unknown = await $.session.messages({ last: 60 })
    const rows = Array.isArray(r) ? r : []
    return rows
      .filter((m: { role?: string; text?: string }) => m && m.role === 'user' && typeof m.text === 'string')
      .map((m: { text: string }) => m.text)
      .slice(-15)
  } catch {
    return []
  }
}

/** Step 0: which language the setup speaks. English is always offered. */
async function askLanguage($: EngineInterface, saved: string): Promise<Lang> {
  const guess = detectLanguage(await recentUserText($)) ?? (saved !== 'en' ? byCode(saved) : null)
  const second = guess && guess.code !== 'en' ? `${guess.endonym} (detected)` : 'Type your language under Other'
  const answer = await $.ui.ask(
    'Which language do you speak? Pick one, or type your language under Other, in English or in your own language (e.g. "German" or "Deutsch").',
    { header: 'Language', options: ['English', second] },
  )
  return parseLanguage(answer) ?? ENGLISH
}

function pick<T extends string>(answer: string, labels: readonly T[]): number {
  const i = labels.findIndex(l => l === answer.trim())
  return i
}

/** The step-by-step setup, using the app's own question dialog. */
async function runSetup($: EngineInterface): Promise<string> {
  const current = await read($, configAtom)
  const lang = await askLanguage($, current.lang)
  const t = lang.t
  const config: Config = { ...current, isSetUp: true, lang: lang.code }

  // Step 1: detail level
  const level = pick(await $.ui.ask(t.s1, { header: t.detail.slice(0, 12), options: t.s1o }), t.s1o)
  config.detail = level === 1 ? 'compact' : level === 2 ? 'full' : 'normal'

  // Step 2: which segments
  const shown = await $.ui.ask(t.s2, { header: t.shows.slice(0, 12), multiSelect: true, options: t.s2o })
  const picked = shown.split(',').map(s => s.trim())
  const has = (i: number) => picked.includes(t.s2o[i])
  const hidden: Group[] = []
  if (!has(0)) hidden.push('limits')
  if (!has(1)) hidden.push('context', 'model')
  if (!has(2)) hidden.push('repo')
  if (!has(3)) hidden.push('duration')
  config.hidden = hidden

  // Step 3: second currency
  const cur = (await $.ui.ask(t.s3, { header: t.currency.slice(0, 12), options: [t.s3usd, 'EUR', 'GBP', 'CHF'] })).trim()
  const code = cur === t.s3usd ? '' : cur.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
  config.currency = code === 'USD' ? '' : code
  config.rate = null

  // Step 4: rate
  if (config.currency) {
    const typed = await $.ui.ask(t.s4(config.currency), { header: 'Rate', options: t.s4o })
    const rate = parseRate(typed)
    if (rate) config.rate = rate
    else config.currency = ''
  }

  await saveConfig($, config)
  try {
    $.ui.toast(t.done)
  } catch {}

  const visible = ['cost' as const, ...GROUPS.filter(g => !hidden.includes(g))].map(g => t.names[g])
  return [
    t.done,
    `  ${t.detail}: ${config.detail}`,
    `  ${t.shows}: ${visible.join(', ')}`,
    `  ${t.currency}: ${config.currency && config.rate ? `USD + ${config.currency} (1 USD = ${config.rate} ${config.currency})` : t.usdOnly}`,
    '',
    t.outro,
  ].join('\n')
}

async function setupCommand($: EngineInterface) {
  try {
    return { text: await runSetup($), isTextDisplayOnly: true as const }
  } catch {
    const lang = byCode((await read($, configAtom)).lang)
    return { text: lang.t.cancelled, isTextDisplayOnly: true as const }
  }
}

/** Back to the defaults; the chosen setup language is kept. */
async function resetCommand($: EngineInterface) {
  const current = await read($, configAtom)
  await saveConfig($, { ...DEFAULTS, isSetUp: true, lang: current.lang })
  return {
    text: 'Tokenomics: back to defaults (normal, everything visible, USD only). Run /tokenomics-setup to choose again.',
    isTextDisplayOnly: true as const,
  }
}

/** The explain text in the language chosen at setup. */
async function explainCommand($: EngineInterface) {
  const config = await read($, configAtom)
  return { text: explainText(config.lang), isTextDisplayOnly: true as const }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'tokenomics',
        description: 'Switch the Tokenomics bar: compact, normal or full (no argument cycles through them)',
      })
    } catch {}
    try {
      await $.command.register({
        name: 'tokenomics-setup',
        description: 'Set up the Tokenomics bar step by step (language, detail level, segments, currency)',
      })
    } catch {}
    try {
      await $.command.register({
        name: 'tokenomics-explain',
        description: 'Explain the Tokenomics cost figure (API cost vs. API value on a subscription)',
      })
    } catch {}
    try {
      await $.command.register({
        name: 'tokenomics-reset',
        description: 'Reset the Tokenomics bar to its defaults (normal, everything visible, USD only)',
      })
    } catch {}
    const config = await loadConfig($)
    if (!config.isSetUp) {
      try {
        $.ui.toast('Tokenomics: type /tokenomics-setup to choose what the bar shows')
      } catch {}
    }
    void refreshRepo($)
    return next(e)
  })

  on('command.run', { command: 'tokenomics' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'explain' || arg === 'help') return explainCommand($)
    if (arg === 'setup') return setupCommand($)
    const current = await read($, configAtom)
    if (arg === 'reset') return resetCommand($)
    const nextLevel: Detail = ORDER.includes(arg as Detail)
      ? (arg as Detail)
      : ORDER[(ORDER.indexOf(current.detail) + 1) % ORDER.length]
    await saveConfig($, { ...current, detail: nextLevel })
    return { text: `Tokenomics: ${nextLevel}`, isTextDisplayOnly: true }
  })

  on('command.run', { command: 'tokenomics-setup' }, async ($, e) => setupCommand($))

  on('command.run', { command: 'tokenomics-explain' }, async ($, e) => explainCommand($))

  on('command.run', { command: 'tokenomics-reset' }, async ($, e) => resetCommand($))

  on('session.measure', async ($, e, next) => {
    await update($, tick, n => n + 1)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await refreshRepo($)
    await update($, tick, n => n + 1)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    try {
      await read($, tick)
      const config = await read($, configAtom)
      const repo = await read($, repoAtom)
      const usage = await $.session.usage()
      let model: string | undefined
      try {
        model = await $.session.model()
      } catch {}
      const now = await $.clock.now()

      const segs: Segment[] = segments({
        now,
        startedAt: usage.startedAt,
        costUsd: usage.cost?.usd,
        hasUnknownPrice: usage.cost?.hasUnknownPrice,
        rateLimits: usage.rateLimits ?? [],
        contextPercent: usage.context?.percent,
        model,
        project: repo?.project,
        branch: repo?.branch,
        dirty: repo?.dirty,
        added: repo?.added,
        removed: repo?.removed,
        detail: config.detail,
        currency: config.currency || undefined,
        rate: config.rate ?? undefined,
      }).filter(s => {
        const g = groupOf(s.key)
        return g === null || !config.hidden.includes(g)
      })
      if (segs.length === 0) return next(e)

      // Order: "Tokenomics <version>", session time, then everything else.
      const duration = segs.filter(s => s.key === 'duration')
      const ordered: Segment[] = [
        { key: 'brand', text: `Tokenomics ${VERSION}`, level: 'ok' },
        ...duration,
        ...segs.filter(s => s.key !== 'duration'),
      ]

      const { Box, Text } = $.ui.resolve(e)
      const color = (l: string) => (l === 'alert' ? 'error' : l === 'warn' ? 'warning' : l === 'good' ? 'success' : undefined)
      return h(
        Box,
        { flexDirection: 'row', flexWrap: 'wrap' },
        ...ordered.map((s, i) =>
          h(Text, { key: s.key, color: color(s.level), dimColor: s.level === 'ok' }, (i > 0 ? '  ·  ' : '') + s.text),
        ),
      )
    } catch (err) {
      const { Text } = $.ui.resolve(e)
      return h(Text, { color: 'error' }, 'tokenomics error: ' + String(err).slice(0, 200))
    }
  })
}
