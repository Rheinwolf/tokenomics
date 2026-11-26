import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { baseName, parseChanges, parseEcbRate, parseRate, segments } from './format.ts'
import type { ChangedFile, Segment } from './format.ts'
import { byCode, detectLanguage, ENGLISH, parseLanguage } from './lang.ts'
import type { Item, Lang } from './lang.ts'
import { explainText, VERSION } from './explain.ts'

type Group = Item
type Config = {
  /** Quick switch from /tokenomics: only cost, limits and context, no reset times. */
  compact: boolean
  currency: string
  rate: number | null
  liveRate: boolean
  showPane: boolean
  hidden: Group[]
  isSetUp: boolean
  lang: string
}
type Repo = {
  project: string
  branch: string | null
  dirty: boolean
  added: number
  removed: number
  files: ChangedFile[]
} | null
type Ecb = { currency: string; rate: number; date: string; fetchedDay: string } | null

const DEFAULTS: Config = {
  compact: false,
  currency: '',
  rate: null,
  liveRate: false,
  showPane: false,
  hidden: [],
  isSetUp: false,
  lang: 'en',
}
const STORE_KEY = 'config'
const ECB_KEY = 'ecb'
const GROUPS: Group[] = ['limits', 'resets', 'context', 'model', 'repo', 'lines', 'duration']
const PANE = 'tokenomics-changes'

const tick = atom({ plugin: 'tokenomics-bar', key: 'tick' } as const, 0)
const configAtom = atom({ plugin: 'tokenomics-bar', key: 'config' } as const, DEFAULTS as Config)
const repoAtom = atom({ plugin: 'tokenomics-bar', key: 'repo' } as const, null as Repo)
const ecbAtom = atom({ plugin: 'tokenomics-bar', key: 'ecb' } as const, null as Ecb)

function groupOf(key: string): Group | null {
  if (key.startsWith('limit-')) return 'limits'
  if (key === 'context') return 'context'
  if (key === 'model') return 'model'
  if (key === 'repo') return 'repo'
  if (key === 'lines') return 'lines'
  if (key === 'duration') return 'duration'
  return null
}

function sanitize(raw: unknown): Config {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<Config> & { detail?: string }
  return {
    // Before 0.6.0 there was a detail level; "compact" carries over as the quick switch.
    compact: typeof c.compact === 'boolean' ? c.compact : c.detail === 'compact',
    currency: typeof c.currency === 'string' ? c.currency.trim().toUpperCase().slice(0, 6) : '',
    rate: typeof c.rate === 'number' && Number.isFinite(c.rate) && c.rate > 0 ? c.rate : null,
    liveRate: c.liveRate === true,
    showPane: c.showPane === true,
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
    // Project, changed lines and the changes pane all off: run no git command at all.
    const cfg = await read($, configAtom)
    if (cfg.hidden.includes('repo') && cfg.hidden.includes('lines') && !cfg.showPane) return
    const root = await $.session.root()
    const repo = {
      project: baseName(root),
      branch: null as string | null,
      dirty: false,
      added: 0,
      removed: 0,
      files: [] as ChangedFile[],
    }
    // Three read-only git commands, run locally in the project folder. Nothing leaves the machine.
    const branch = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, timeoutMs: 5000 })
    if (branch.exitCode === 0) {
      repo.branch = branch.stdout.trim() || null
      const status = await $.process.run(['git', 'status', '--porcelain'], { cwd: root, timeoutMs: 5000 })
      const numstat = await $.process.run(['git', 'diff', '--numstat', 'HEAD'], { cwd: root, timeoutMs: 5000 })
      const statusOut = status.exitCode === 0 ? status.stdout : ''
      repo.dirty = statusOut.trim().length > 0
      repo.files = parseChanges(numstat.exitCode === 0 ? numstat.stdout : '', statusOut)
      for (const f of repo.files) {
        repo.added += f.added
        repo.removed += f.removed
      }
    }
    await update($, repoAtom, () => repo)
  } catch {
    // No git or a refused call: the repo segment stays hidden.
  }
}

/**
 * Opt-in only: the daily ECB reference rate for the chosen currency. At most one request
 * per day, to ecb.europa.eu, without any data about the user; cached in the local store.
 */
async function refreshRate($: EngineInterface): Promise<void> {
  try {
    const config = await read($, configAtom)
    if (!config.liveRate || !config.currency) return
    const today = new Date(await $.clock.now()).toISOString().slice(0, 10)
    const cached = (await $.store.get(ECB_KEY)) as Ecb
    if (cached && cached.currency === config.currency && cached.fetchedDay === today) {
      await update($, ecbAtom, () => cached)
      return
    }
    const res = await $.http.fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml')
    const parsed = res.ok ? parseEcbRate(res.text, config.currency) : null
    if (parsed) {
      const ecb: Ecb = { currency: config.currency, rate: parsed.rate, date: parsed.date, fetchedDay: today }
      await $.store.set(ECB_KEY, ecb)
      await update($, ecbAtom, () => ecb)
    } else if (cached && cached.currency === config.currency) {
      await update($, ecbAtom, () => cached) // offline or ECB down: keep the last known rate
    }
  } catch {
    // No network: the converted value is simply left out.
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

/** The step-by-step setup, using the app's own question dialog. */
async function runSetup($: EngineInterface): Promise<string> {
  const current = await read($, configAtom)
  const lang = await askLanguage($, current.lang)
  const t = lang.t
  const config: Config = { ...current, isSetUp: true, lang: lang.code, compact: false }
  let n = 0
  const step = (text: string) => `${++n} · ${text}`

  // One yes/no question per item, each with its own explanation. "Other" text counts as yes.
  const hidden: Group[] = []
  for (const item of GROUPS) {
    if (item === 'lines' && hidden.includes('repo')) {
      hidden.push('lines') // changed lines come from git; no project + git, no lines
      continue
    }
    const answer = await $.ui.ask(step(t.items[item]), { header: t.names[item].slice(0, 12), options: [t.yes, t.no] })
    if (answer.trim() === t.no) hidden.push(item)
  }
  config.hidden = hidden

  // Second currency
  const cur = (await $.ui.ask(step(t.s3), { header: t.currency.slice(0, 12), options: [t.s3usd, 'EUR', 'GBP', 'CHF'] })).trim()
  const code = cur === t.s3usd ? '' : cur.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
  config.currency = code === 'USD' ? '' : code
  config.rate = null
  config.liveRate = false

  // Rate: daily ECB rate (opt-in) or a fixed rate typed under Other
  if (config.currency) {
    const answer = await $.ui.ask(step(t.s4(config.currency)), { header: 'Rate', options: [t.s4live, t.s4o[0]] })
    if (answer.trim() === t.s4live) {
      config.liveRate = true
    } else {
      const rate = parseRate(answer)
      if (rate) config.rate = rate
      else config.currency = ''
    }
  }

  await saveConfig($, config)
  await update($, ecbAtom, () => null)
  await refreshRate($)
  try {
    $.ui.toast(t.done)
  } catch {}

  const currencyText = !config.currency
    ? t.usdOnly
    : config.liveRate
      ? `USD + ${config.currency} (${t.ecbDaily})`
      : `USD + ${config.currency} (1 USD = ${config.rate} ${config.currency})`
  const visible = ['cost' as const, ...GROUPS.filter(g => !hidden.includes(g))].map(g => t.names[g])
  return [
    t.done,
    `  ${t.shows}: ${visible.join(', ')}`,
    `  ${t.currency}: ${currencyText}`,
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
  await update($, ecbAtom, () => null)
  try {
    await $.ui.close({ id: PANE })
  } catch {}
  return {
    text: 'Tokenomics: back to defaults (everything visible, USD only, changes pane closed). Run /tokenomics-setup to choose again.',
    isTextDisplayOnly: true as const,
  }
}

/** The explain text in the language chosen at setup. */
async function explainCommand($: EngineInterface) {
  const config = await read($, configAtom)
  return { text: explainText(config.lang), isTextDisplayOnly: true as const }
}

/** Opens or closes the pane that lists every changed file since the last commit. */
async function changesCommand($: EngineInterface) {
  const config = await read($, configAtom)
  const showPane = !config.showPane
  await saveConfig($, { ...config, showPane })
  if (showPane) {
    await refreshRepo($)
    await $.ui.open({ id: PANE, title: 'Changes' })
    return { text: 'Tokenomics: changes pane opened. Run /tokenomics-changes again to close it.', isTextDisplayOnly: true as const }
  }
  try {
    await $.ui.close({ id: PANE })
  } catch {}
  return { text: 'Tokenomics: changes pane closed.', isTextDisplayOnly: true as const }
}

async function registerCommands($: EngineInterface): Promise<void> {
  const commands = [
    ['tokenomics', 'Switch the Tokenomics bar between compact and your own selection'],
    ['tokenomics-setup', 'Set up the Tokenomics bar: one question per item, with an explanation'],
    ['tokenomics-explain', 'Explain the Tokenomics cost figure (API cost vs. API value on a subscription)'],
    ['tokenomics-changes', 'Open or close a pane listing every changed file since the last commit'],
    ['tokenomics-reset', 'Reset the Tokenomics bar to its defaults (everything visible, USD only)'],
  ] as const
  for (const [name, description] of commands) {
    try {
      await $.command.register({ name, description })
    } catch {}
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await registerCommands($)
    const config = await loadConfig($)
    if (!config.isSetUp) {
      try {
        $.ui.toast('Tokenomics: type /tokenomics-setup to choose what the bar shows')
      } catch {}
    }
    void refreshRepo($)
    void refreshRate($)
    if (config.showPane) void $.ui.open({ id: PANE, title: 'Changes' })
    return next(e)
  })

  on('command.run', { command: 'tokenomics' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'explain' || arg === 'help') return explainCommand($)
    if (arg === 'setup') return setupCommand($)
    if (arg === 'reset') return resetCommand($)
    if (arg === 'changes') return changesCommand($)
    // Quick switch: compact (cost, limits, context) <-> your own selection from the setup.
    const current = await read($, configAtom)
    const compact = arg === 'compact' ? true : arg === 'normal' || arg === 'full' ? false : !current.compact
    await saveConfig($, { ...current, compact })
    return {
      text: compact
        ? 'Tokenomics: compact (cost, limits, context). Run /tokenomics again for your own selection.'
        : 'Tokenomics: your own selection from /tokenomics-setup. Run /tokenomics again for compact.',
      isTextDisplayOnly: true,
    }
  })

  on('command.run', { command: 'tokenomics-setup' }, async ($, e) => setupCommand($))

  on('command.run', { command: 'tokenomics-explain' }, async ($, e) => explainCommand($))

  on('command.run', { command: 'tokenomics-changes' }, async ($, e) => changesCommand($))

  on('command.run', { command: 'tokenomics-reset' }, async ($, e) => resetCommand($))

  on('session.measure', async ($, e, next) => {
    await update($, tick, n => n + 1)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await refreshRepo($)
    await refreshRate($)
    await update($, tick, n => n + 1)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    try {
      const repo = await read($, repoAtom)
      if (!repo) return h(Text, { dimColor: true }, 'No git information (Project + git is off, or this folder is not a git repository).')
      const head = repo.branch ? `${repo.project} · ${repo.branch}` : repo.project
      if (repo.files.length === 0) {
        return h(Box, { flexDirection: 'column' }, h(Text, { weight: 'semibold' }, head), h(Text, { dimColor: true }, 'No changes since the last commit.'))
      }
      const room = Math.max(3, (e.viewport?.rows ?? 30) - 4)
      const shown = repo.files.slice(0, room)
      const rows = shown.map(f =>
        h(
          Box,
          { key: f.path, flexDirection: 'row' },
          f.isNew
            ? h(Text, { color: 'diffAdded' }, 'new    ')
            : f.isBinary
              ? h(Text, { dimColor: true }, 'binary ')
              : h(
                  Text,
                  {},
                  h(Text, { color: 'diffAdded' }, `+${f.added}`.padEnd(6)),
                  h(Text, { color: 'diffRemoved' }, `−${f.removed}`.padEnd(6)),
                ),
          h(Text, {}, ' ' + f.path),
        ),
      )
      const more = repo.files.length - shown.length
      return h(
        Box,
        { flexDirection: 'column' },
        h(Text, { weight: 'semibold' }, head),
        h(
          Text,
          { dimColor: true },
          `${repo.files.length} file${repo.files.length === 1 ? '' : 's'} changed since the last commit · +${repo.added} / −${repo.removed} lines`,
        ),
        h(Text, {}, ' '),
        ...rows,
        ...(more > 0 ? [h(Text, { dimColor: true }, `… and ${more} more`)] : []),
      )
    } catch (err) {
      return h(Text, { color: 'error' }, 'tokenomics error: ' + String(err).slice(0, 200))
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    try {
      await read($, tick)
      const config = await read($, configAtom)
      const repo = await read($, repoAtom)
      const ecb = await read($, ecbAtom)
      const usage = await $.session.usage()
      let model: string | undefined
      try {
        model = await $.session.model()
      } catch {}
      const now = await $.clock.now()
      const live = config.liveRate && ecb && ecb.currency === config.currency ? ecb : null

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
        detail: config.compact ? 'compact' : 'full',
        resets: !config.hidden.includes('resets'),
        currency: config.currency || undefined,
        rate: live ? live.rate : (config.rate ?? undefined),
        rateSource: live ? `ECB ${live.date}` : undefined,
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
