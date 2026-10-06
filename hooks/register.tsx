import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { Limit } from '../types'
import { barSvg, textLine } from './bar'

const snapshot = atom({ plugin: 'usage-bar', key: 'snapshot' } as const, {
  limits: [],
  limitsAt: null,
  costUsd: null,
})
const tokens = atom({ plugin: 'usage-bar', key: 'tokens' } as const, {
  input: 0,
  output: 0,
  cache: 0,
})

const isHidden = atom({ plugin: 'usage-bar', key: 'isHidden' } as const, false)

// The store key every session writes its latest reading under, so an idle
// session can show what a busy one last saw.
const SHARED = 'limits'

type Shared = { limits: Limit[]; at: number }

function limitsOf(rateLimits: SessionRateLimit[]): Limit[] {
  return rateLimits.map(one => ({
    kind: one.kind,
    percentUsed: one.percentUsed,
    resetsAt: one.resetsAt ?? null,
  }))
}

function sharedOf(stored: unknown): Shared | null {
  if (typeof stored !== 'object' || stored === null) {
    return null
  }

  const { limits, at } = stored as { limits?: unknown; at?: unknown }
  const isValid =
    typeof at === 'number' &&
    Array.isArray(limits) &&
    limits.every(
      (one: unknown) =>
        typeof one === 'object' &&
        one !== null &&
        typeof (one as Limit).kind === 'string' &&
        typeof (one as Limit).percentUsed === 'number' &&
        (typeof (one as Limit).resetsAt === 'string' || (one as Limit).resetsAt === null),
    )

  return isValid ? { limits: limits as Limit[], at: at as number } : null
}

// Takes the reading another session stored when it is newer than this one's.
async function adopt($: EngineInterface): Promise<void> {
  const shared = sharedOf(await $.store.get(SHARED))

  if (shared === null || shared.limits.length === 0) {
    return
  }

  await update($, snapshot, held =>
    held.limitsAt !== null && held.limitsAt >= shared.at
      ? held
      : { ...held, limits: shared.limits, limitsAt: shared.at },
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-bar',
      description: 'Show or hide the usage bar above the prompt',
    })
    // How old this reading is cannot be known here, so it carries no time and
    // any stored one replaces it.
    const usage = await $.session.usage()
    await update($, snapshot, held => ({
      limits: held.limitsAt === null ? limitsOf(usage.rateLimits) : held.limits,
      limitsAt: held.limitsAt,
      costUsd: usage.cost?.usd ?? held.costUsd,
    }))
    await adopt($)
    // The countdowns move with the clock, and another session's reading
    // arrives through the store: neither raises an event here.
    $.clock.every(60_000, () => {
      void adopt($).finally(() => $.ui.invalidate('ui.render'))
    })

    return next(e)
  })

  on('command.run', { command: 'usage-bar' }, async $ => {
    const hidden = !(await read($, isHidden))
    await update($, isHidden, () => hidden)

    return { text: hidden ? 'Usage bar hidden.' : 'Usage bar shown.' }
  })

  on('session.measure', async ($, e, next) => {
    const limits = limitsOf(e.rateLimits)
    const at = await $.clock.now()
    await update($, snapshot, held => ({
      limits: limits.length > 0 ? limits : held.limits,
      limitsAt: limits.length > 0 ? at : held.limitsAt,
      costUsd: e.cost?.usd ?? held.costUsd,
    }))

    if (limits.length > 0) {
      const shared: Shared = { limits, at }
      await $.store.set(SHARED, shared)
    }

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const { usage } = e

    if (usage !== undefined) {
      await update($, tokens, sum => ({
        input: sum.input + usage.input_tokens + usage.cache_creation_input_tokens,
        output: sum.output + usage.output_tokens,
        cache: sum.cache + usage.cache_read_input_tokens,
      }))
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Hidden, the band draws nothing at all; /usage-bar brings it back.
    if (e.props.hasSurvey || (await read($, isHidden))) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)

    const now = await $.clock.now()
    const shown = await read($, snapshot)
    const sum = await read($, tokens)
    const line = textLine(shown, sum, now)
    const hide = (
      <Button
        key="hide"
        plain
        dimColor
        role="dismiss"
        label="×"
        onPress={async () => {
          await update($, isHidden, () => true)
          $.ui.toast('Usage bar hidden. Type /usage-bar to show it again.')
        }}
      />
    )

    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)

      return (
        <Box alignItems="center" gap={1}>
          <Svg source={barSvg(shown, sum, now)} alt={line} />
          {hide}
        </Box>
      )
    }

    return (
      <Box gap={1}>
        <Text dimColor wrap="truncate-end">
          {line}
        </Text>
        {hide}
      </Box>
    )
  })
}
