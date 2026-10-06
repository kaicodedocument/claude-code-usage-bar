import type { RenderElement } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const NOW = Date.parse('2026-10-06T12:00:00Z')
const BAND = {
  plugin: 'usage-bar',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

test('the band shows the windows, tokens and cost on each surface', async ($, on) => {
  mock.clock(on, { now: NOW })
  mock.store(on)
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('turn.complete', (_, e) => ({ text: e.answer }))

  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 20.4, resetsAt: '2026-10-06T14:40:00Z' },
      { kind: 'seven_day', percentUsed: 58, resetsAt: '2026-10-07T19:00:00Z' },
    ],
    cost: { usd: 4.32 },
    changed: ['rateLimits', 'cost'],
  })
  await $.turn.complete({
    answer: 'done',
    durationMs: 1000,
    isAborted: false,
    turnId: 't1',
    reason: 'answer',
    usage: {
      model: 'claude-opus-5-5',
      input_tokens: 600,
      cache_creation_input_tokens: 15_000,
      output_tokens: 3000,
      cache_read_input_tokens: 954_200,
    },
  })

  const line = '5h 80% left (2h 40m) | 7d 42% left (1d 7h) | in 15.6k | out 3.0k | cache 954.2k | $4.32'
  const terminal = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await terminal.find({ type: 'Text' }))?.text).toBe(line)
  await terminal.unmount()

  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await desktop.find({ type: 'Svg' })
  expect(svg?.props.alt).toBe(line)
  expect(String(svg?.props.source)).toContain('>954.2k<')
  await desktop.unmount()
})

test('with no reading yet the band still draws placeholders', async ($, on) => {
  mock.clock(on, { now: NOW })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toBe(
    '5h --% left (--) | 7d --% left (--) | in 0 | out 0 | cache 0 | $--',
  )
  await ui.unmount()
})

test('the close button hides the bar and /usage-bar brings it back', async ($, on) => {
  mock.clock(on, { now: NOW })
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, null) as RenderElement)
  on('ui.toast', () => ({ value: undefined }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    await ui.press({ key: 'hide' })
    expect(await ui.find({ key: 'hide' })).toBeUndefined()
    await $.command.run({
      command: 'usage-bar',
      args: '',
      origin: { kind: 'composer' },
      presentation: { isFullscreen: false, columns: 120 },
    })
    expect(await ui.find({ key: 'hide' })).toBeDefined()
    await ui.unmount()
  }
})

test('an idle session shows the reading another session stored, and fades an old one', async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  const reading = (percentUsed: number, at: number) => ({
    limits: [{ kind: 'five_hour', percentUsed, resetsAt: '2026-10-06T14:40:00Z' }],
    at,
  })
  // What another session wrote: the test changes it as that session would.
  let stored = reading(35, NOW - 60_000)
  on('store.get', () => ({ value: stored }))
  on('session.usage', () => ({ value: { startedAt: NOW, context: { window: 200_000 }, rateLimits: [] } }))
  on('command.register', () => ({ value: { command: 'usage-bar' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ type: 'Text' }))?.text).toContain('5h 65% left (2h 40m)')

  stored = reading(50, NOW + 30_000)
  await clock.advance(60_000)
  expect((await ui.find({ type: 'Text' }))?.text).toContain('5h 50% left')

  await clock.advance(11 * 60_000)
  expect((await ui.find({ type: 'Text' }))?.text).toContain('5h ~50% left')
  await ui.unmount()
})

test('options set the theme, the cache-write split and the fade time', { options: { theme: 'dark', countCacheWrites: false, staleMinutes: 1 } }, async ($, on) => {
  const clock = mock.clock(on, { now: NOW })
  mock.store(on)
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('turn.complete', (_, e) => ({ text: e.answer }))

  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 20, resetsAt: '2026-10-06T14:40:00Z' }],
    changed: ['rateLimits'],
  })
  await $.turn.complete({
    answer: 'done',
    durationMs: 1000,
    isAborted: false,
    turnId: 't1',
    reason: 'answer',
    usage: {
      model: 'claude-opus-5-5',
      input_tokens: 600,
      cache_creation_input_tokens: 15_000,
      output_tokens: 3000,
      cache_read_input_tokens: 1000,
    },
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  expect(svg?.props.alt).toContain('5h 80% left (2h 40m) | 7d --% left (--) | in 600 | out 3.0k | cache 16.0k')
  expect(String(svg?.props.source)).toContain('#1f3a2e')
  expect(String(svg?.props.source)).not.toContain('#cfe3d8')

  await ui.unmount()

  // No timer runs in this test, so a fresh mount stands for the next redraw.
  await clock.advance(2 * 60_000)
  const later = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await later.find({ type: 'Svg' }))?.props.alt).toContain('5h ~80% left')
  await later.unmount()
})
