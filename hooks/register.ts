import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { baseName, parseRate, segments } from './format.ts'
import type { Segment } from './format.ts'

type Detail = 'compact' | 'normal' | 'full'
type Group = 'limits' | 'context' | 'model' | 'repo' | 'duration'
type Config = {
  detail: Detail
  currency: string
  rate: number | null
  hidden: Group[]
  isSetUp: boolean
}
type Repo = { project: string; branch: string | null; dirty: boolean; added: number; removed: number } | null

const DEFAULTS: Config = { detail: 'normal', currency: '', rate: null, hidden: [], isSetUp: false }
const STORE_KEY = 'config'
const ORDER: Detail[] = ['compact', 'normal', 'full']
const GROUPS: Group[] = ['limits', 'context', 'model', 'repo', 'duration']

const tick = atom({ plugin: 'tokenomics', key: 'tick' } as const, 0)
const configAtom = atom({ plugin: 'tokenomics', key: 'config' } as const, DEFAULTS as Config)
const repoAtom = atom({ plugin: 'tokenomics', key: 'repo' } as const, null as Repo)

const EXPLAIN = [
  'Tokenomics: how the cost figure works',
  '',
  '- "API cost this session": you pay per token (API billing). The figure is a',
  '  client-side estimate at list prices; your invoice is the final authority.',
  '- "API value this session - covered by subscription": you are on a plan',
  '  (detected because 5h/7d limit data is present). The figure is what this',
  '  session would cost at API list prices. It is NOT billed, your plan price is',
  '  not subtracted, and it covers this session only, so it is not a "saving".',
  "- A trailing * means a model without a known price was counted at another model's rates.",
  '- The second currency (if set) uses your fixed rate; no live rates are fetched.',
  '  Tokenomics only reads local session data and sends nothing.',
  '',
  'Commands:',
  '  /tokenomics setup     step-by-step setup',
  '  /tokenomics           cycle compact > normal > full',
  '  /tokenomics full      jump to a level (compact, normal, full)',
  '  /tokenomics explain   this text',
  '  /tokenomics reset     back to defaults',
].join('\n')

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
    const root = await $.session.root()
    const repo = { project: baseName(root), branch: null as string | null, dirty: false, added: 0, removed: 0 }
    const copy = await $.vcs.detect({ path: root })
    if (copy) {
      repo.branch = copy.branch ?? null
      const diff = await $.vcs.diff({ path: root, vcs: copy.vcs, base: 'head', isStatOnly: true })
      if (diff.files) {
        repo.dirty = diff.files.length > 0
        for (const f of diff.files) {
          repo.added += f.added || 0
          repo.removed += f.removed || 0
        }
      }
    }
    await update($, repoAtom, () => repo)
  } catch {
    // No git or a refused call: the repo segment stays hidden.
  }
}

/** The step-by-step setup, using the app's own question dialog. */
async function runSetup($: EngineInterface): Promise<string> {
  const current = await read($, configAtom)
  const config: Config = { ...current, isSetUp: true }

  // Step 1: detail level
  const level = await $.ui.ask(
    'Step 1/4 - How much should the bar show? ' +
      'Compact: cost, limits and context only, no reset times. ' +
      'Normal: adds reset times, model, project + git branch and session time. ' +
      'Full: adds uncommitted lines (+/-) and a footnote explaining the cost figure.',
    { header: 'Detail', options: ['Normal (recommended)', 'Compact', 'Full'] },
  )
  config.detail = level.startsWith('Compact') ? 'compact' : level.startsWith('Full') ? 'full' : 'normal'

  // Step 2: which segments
  const shown = await $.ui.ask(
    'Step 2/4 - Which extras should be visible? The cost figure always shows. ' +
      'Limits = 5h/7d usage (subscriptions only). Context = how full the context window is, plus the model. ' +
      'Project = folder name, git branch and ✗ for uncommitted changes. Tick what you want to see.',
    {
      header: 'Segments',
      multiSelect: true,
      options: ['Limits (5h / 7d)', 'Context + model', 'Project + git', 'Session time'],
    },
  )
  const picked = shown.split(',').map(s => s.trim())
  const hidden: Group[] = []
  if (!picked.includes('Limits (5h / 7d)')) hidden.push('limits')
  if (!picked.includes('Context + model')) hidden.push('context', 'model')
  if (!picked.includes('Project + git')) hidden.push('repo')
  if (!picked.includes('Session time')) hidden.push('duration')
  config.hidden = hidden

  // Step 3: second currency
  const cur = await $.ui.ask(
    'Step 3/4 - Show the cost in a second currency as well? ' +
      'Dollars always stay. The conversion uses a fixed rate you choose; nothing is fetched from the internet. ' +
      'Pick one, or type another code (e.g. JPY) under Other.',
    { header: 'Currency', options: ['USD only', 'EUR', 'GBP', 'CHF'] },
  )
  const code = cur.trim().toUpperCase()
  config.currency = code.startsWith('USD') ? '' : code.replace(/[^A-Z]/g, '').slice(0, 6)
  config.rate = null

  // Step 4: rate
  if (config.currency) {
    const typed = await $.ui.ask(
      `Step 4/4 - Fixed rate: 1 USD = how many ${config.currency}? ` +
        'Type the number under Other (e.g. 0.92). In full mode the bar shows the rate next to the converted value.',
      { header: 'Rate', options: ['Skip, USD only', 'I will type it under Other'] },
    )
    const rate = parseRate(typed)
    if (rate) config.rate = rate
    else config.currency = ''
  }

  await saveConfig($, config)
  try {
    $.ui.toast('Tokenomics is set up')
  } catch {}

  const visible = ['cost', ...GROUPS.filter(g => !hidden.includes(g))]
  return [
    'Tokenomics is set up.',
    `  Detail:   ${config.detail}`,
    `  Shows:    ${visible.join(', ')}`,
    `  Currency: ${config.currency && config.rate ? `USD + ${config.currency} (1 USD = ${config.rate} ${config.currency})` : 'USD only'}`,
    '',
    'Change it any time with /tokenomics setup. /tokenomics explain explains the cost figure.',
  ].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'tokenomics',
        description: 'Tokenomics bar: "setup" to configure, "explain" for the cost figure, no argument cycles the detail level',
      })
    } catch {}
    const config = await loadConfig($)
    if (!config.isSetUp) {
      try {
        $.ui.toast('Tokenomics: type /tokenomics setup to choose what the bar shows')
      } catch {}
    }
    void refreshRepo($)
    return next(e)
  })

  on('command.run', { command: 'tokenomics' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    if (arg === 'explain' || arg === 'help') return { text: EXPLAIN, isTextDisplayOnly: true }
    if (arg === 'setup') {
      try {
        return { text: await runSetup($), isTextDisplayOnly: true }
      } catch {
        return { text: 'Tokenomics setup cancelled. Nothing was changed.', isTextDisplayOnly: true }
      }
    }
    const current = await read($, configAtom)
    if (arg === 'reset') {
      await saveConfig($, { ...DEFAULTS, isSetUp: true })
      return { text: 'Tokenomics: back to defaults.', isTextDisplayOnly: true }
    }
    const nextLevel: Detail = ORDER.includes(arg as Detail)
      ? (arg as Detail)
      : ORDER[(ORDER.indexOf(current.detail) + 1) % ORDER.length]
    await saveConfig($, { ...current, detail: nextLevel })
    return { text: `Tokenomics: ${nextLevel}`, isTextDisplayOnly: true }
  })

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

      const { Box, Text } = $.ui.resolve(e)
      const color = (l: string) => (l === 'alert' ? 'error' : l === 'warn' ? 'warning' : undefined)
      const row = h(
        Box,
        { flexDirection: 'row', flexWrap: 'wrap' },
        ...segs.map((s, i) =>
          h(Text, { key: s.key, color: color(s.level), dimColor: s.level === 'ok' }, (i > 0 ? '  ·  ' : '') + s.text),
        ),
      )
      if (config.detail !== 'full') return row
      return h(
        Box,
        { flexDirection: 'column' },
        row,
        h(Text, { dimColor: true }, 'Cost is an estimate at API list prices for this session only. /tokenomics explain'),
      )
    } catch (err) {
      const { Text } = $.ui.resolve(e)
      return h(Text, { color: 'error' }, 'tokenomics error: ' + String(err).slice(0, 200))
    }
  })
}
