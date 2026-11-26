import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { baseName, parseRate, segments } from './format.ts'

type Detail = 'compact' | 'normal' | 'full'
type Repo = { project: string; branch: string | null; dirty: boolean; added: number; removed: number } | null

const tick = atom({ plugin: 'tokenomics', key: 'tick' } as const, 0)
const detailAtom = atom({ plugin: 'tokenomics', key: 'detail' } as const, null as Detail | null)
const repoAtom = atom({ plugin: 'tokenomics', key: 'repo' } as const, null as Repo)

const ORDER: Detail[] = ['compact', 'normal', 'full']

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
  '- The second currency (if set) uses the fixed rate from the settings; no live',
  '  rates are fetched. The bar only reads local session data and sends nothing.',
  '',
  'Commands: /tokenomics (cycle compact > normal > full), /tokenomics explain',
].join('\n')

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

export const register: Register = (on, options) => {
  const opts = (options ?? {}) as Record<string, unknown>
  const configured: Detail = ORDER.includes(opts.detail as Detail) ? (opts.detail as Detail) : 'normal'
  const currency = typeof opts.currency === 'string' ? opts.currency.trim().toUpperCase().slice(0, 6) : ''
  const rate = parseRate(opts.rate)

  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: 'tokenomics',
        description: 'Cycle the session bar detail (compact/normal/full); "explain" explains the cost figure',
      })
    } catch {}
    void refreshRepo($)
    return next(e)
  })

  on('command.run', { command: 'tokenomics' }, async ($, e) => {
    const arg = String((e as { args?: string }).args ?? '').trim().toLowerCase()
    if (arg === 'explain' || arg === 'help') return { text: EXPLAIN }
    const current = (await read($, detailAtom)) ?? configured
    const nextLevel: Detail = ORDER.includes(arg as Detail)
      ? (arg as Detail)
      : ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
    await update($, detailAtom, () => nextLevel)
    return { text: `Tokenomics: ${nextLevel}` }
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
      const detail = (await read($, detailAtom)) ?? configured
      const repo = await read($, repoAtom)
      const usage = await $.session.usage()
      let model: string | undefined
      try { model = await $.session.model() } catch {}
      const now = await $.clock.now()

      const segs = segments({
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
        detail,
        currency: currency || undefined,
        rate,
      })
      const { Box, Text } = $.ui.resolve(e)
      if (segs.length === 0) return next(e)
      const color = (l: string) => (l === 'alert' ? 'error' : l === 'warn' ? 'warning' : undefined)
      const row = h(
        Box,
        { flexDirection: 'row', flexWrap: 'wrap' },
        ...segs.map((s, i) =>
          h(Text, { key: s.key, color: color(s.level), dimColor: s.level === 'ok' }, (i > 0 ? '  ·  ' : '') + s.text),
        ),
      )
      if (detail !== 'full') return row
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
