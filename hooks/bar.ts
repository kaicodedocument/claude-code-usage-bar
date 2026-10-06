import type { Limit, Snapshot, Counts } from '../types'

const HOUR = 3_600_000

// What the person may set through the mod's options; `styleOf` fills these in.
export type Style = {
  theme: 'light' | 'dark'
  // A reading older than this is drawn faded: the session has been idle since.
  staleAfterMs: number
  // At or below these percentages left, the bar is drawn orange, then red.
  warnBelow: number
  dangerBelow: number
  // Whether the bar says how long ago the rate-limit reading was taken.
  showUpdated: boolean
}

export const DEFAULT_STYLE: Style = {
  theme: 'light',
  staleAfterMs: 10 * 60_000,
  warnBelow: 30,
  dangerBelow: 10,
  showUpdated: true,
}
const WINDOWS: Record<string, { label: string; ms: number }> = {
  five_hour: { label: '5h', ms: 5 * HOUR },
  seven_day: { label: '7d', ms: 7 * 24 * HOUR },
}

export type Window = {
  label: string
  // What is left of the window's allowance, 0 to 100.
  percent: number | null
  // How much of the window's time is left, 0 to 1; null without a reset time.
  timeLeft: number | null
  left: string
  isStale: boolean
}

export function formatCount(n: number): string {
  if (n < 1000) {
    return String(n)
  }

  // 999,950 and up would round to "1000.0k".
  return n < 999_950 ? `${(n / 1000).toFixed(1)}k` : `${(n / 1_000_000).toFixed(2)}M`
}

export function formatLeft(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

export function windowOf(kind: string, snapshot: Snapshot, now: number, style: Style): Window {
  const { limits, limitsAt } = snapshot
  const { label, ms } = WINDOWS[kind] ?? { label: kind, ms: 0 }
  const limit = limits.find(one => one.kind === kind)

  if (limit === undefined) {
    return { label, percent: null, timeLeft: null, left: '--', isStale: false }
  }

  const resetsIn = limit.resetsAt === null ? NaN : Date.parse(limit.resetsAt) - now
  const hasReset = Number.isFinite(resetsIn) && ms > 0

  return {
    label,
    percent: Math.max(0, 100 - Math.round(limit.percentUsed)),
    timeLeft: hasReset ? Math.min(1, Math.max(0, resetsIn / ms)) : null,
    left: hasReset ? formatLeft(resetsIn) : '--',
    // Past its reset the percentage describes a window that is over.
    isStale: limitsAt === null || now - limitsAt > style.staleAfterMs || (hasReset && resetsIn <= 0),
  }
}

export function formatCost(usd: number | null): string {
  return usd === null ? '$--' : `$${usd.toFixed(2)}`
}

// How long ago the rate-limit reading was taken: `now` under a minute, `--`
// when there is no reading or its time is unknown.
export function formatAge(snapshot: Snapshot, now: number): string {
  if (snapshot.limits.length === 0 || snapshot.limitsAt === null) {
    return '--'
  }

  const age = now - snapshot.limitsAt

  return age < 60_000 ? 'now' : formatLeft(age)
}

export function textLine(snapshot: Snapshot, counts: Counts, now: number, style: Style): string {
  const windows = ['five_hour', 'seven_day'].map(kind => {
    const w = windowOf(kind, snapshot, now, style)

    return `${w.label} ${w.isStale ? '~' : ''}${w.percent ?? '--'}% left (${w.left})`
  })

  const age = formatAge(snapshot, now)
  const updated = style.showUpdated && snapshot.limits.length > 0
    ? [`updated ${age === 'now' || age === '--' ? age : `${age} ago`}`]
    : []

  return [
    ...windows,
    ...updated,
    `in ${formatCount(counts.input)}`,
    `out ${formatCount(counts.output)}`,
    `cache ${formatCount(counts.cache)}`,
    formatCost(snapshot.costUsd),
  ].join(' | ')
}

// The desktop drawing: one SVG, laid out left to right in CSS pixels.
const FONT = 14
const CHAR = FONT * 0.6
const HEIGHT = 32
const PILL = 30
const TOP = (HEIGHT - PILL) / 2
const MID = HEIGHT / 2

type Palette = {
  ink: string
  // The refresh mark and its age, drawn on the band itself and not on a pill.
  muted: string
  warn: string
  danger: string
  // Per pill, in the order drawn: its background and its icon and bar color.
  pills: readonly { background: string; accent: string }[]
}

const PALETTES: Record<Style['theme'], Palette> = {
  light: {
    ink: '#1f2328',
    muted: '#6b7076',
    warn: '#c77d1a',
    danger: '#c0392b',
    pills: [
      { background: '#cfe3d8', accent: '#3f8f6b' },
      { background: '#dad5f0', accent: '#6b55c9' },
      { background: '#f1d6d0', accent: '#c0503c' },
      { background: '#d6e7d6', accent: '#3f8f5a' },
      { background: '#d4daf3', accent: '#4a5fd0' },
      { background: '#efe4c4', accent: '#a8811c' },
    ],
  },
  dark: {
    ink: '#e6e8eb',
    muted: '#9aa0a6',
    warn: '#e0a040',
    danger: '#f0705f',
    pills: [
      { background: '#1f3a2e', accent: '#6fcf9f' },
      { background: '#2e2850', accent: '#a594f0' },
      { background: '#4a2620', accent: '#ef8f7c' },
      { background: '#22382a', accent: '#7fcf95' },
      { background: '#232c52', accent: '#8a9cf5' },
      { background: '#40361a', accent: '#e0b84a' },
    ],
  },
}

const ICONS = {
  gauge: '<path d="M2.5 12a5.5 5.5 0 1 1 11 0"/><path d="M8 12l3-4"/>',
  clock: '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 1.5"/>',
  calendar: '<rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M2.5 7h11M5.5 2v3M10.5 2v3"/>',
  up: '<path d="M8 10V2.5M5 5.5l3-3 3 3M3 10v3.5h10V10"/>',
  down: '<path d="M8 2.5V10M5 7l3 3 3-3M3 10v3.5h10V10"/>',
  layers: '<path d="M8 2l6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3"/>',
  refresh: '<path d="M13 8a5 5 0 1 1-1.6-3.6M13 2.8v3.2H9.8"/>',
  coin: '<circle cx="8" cy="8" r="5.5"/><path d="M9.8 6.2c-.3-.6-1-.9-1.8-.9-1 0-1.8.5-1.8 1.3 0 1.9 3.7.8 3.7 2.8 0 .8-.8 1.3-1.9 1.3-.9 0-1.6-.4-1.9-1M8 4.2v7.6"/>',
}

type Part =
  | { icon: keyof typeof ICONS; color: string }
  | { text: string; isBold?: boolean; isFaded?: boolean; color?: string }
  | { bar: Window; color: string }
  | { rule: true }

function widthOf(part: Part): number {
  if ('icon' in part) {
    return 16
  }

  if ('text' in part) {
    return Math.ceil(part.text.length * CHAR)
  }

  return 'bar' in part ? 84 : 1
}

function drawPart(part: Part, x: number, style: Style): string {
  const { ink, warn, danger } = PALETTES[style.theme]

  if ('icon' in part) {
    return `<g transform="translate(${x} ${MID - 8})" fill="none" stroke="${part.color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[part.icon]}</g>`
  }

  if ('text' in part) {
    return `<text x="${x}" y="${MID + 5}" fill="${part.color ?? ink}" font-weight="${part.isBold ? 700 : 400}"${part.isFaded ? ' opacity="0.4"' : ''}>${part.text}</text>`
  }

  if ('rule' in part) {
    return `<rect x="${x}" y="${MID - 9}" width="1" height="18" fill="${ink}" opacity="0.25"/>`
  }

  const { percent, timeLeft, isStale } = part.bar
  const fill = Math.round((Math.min(100, percent ?? 0) / 100) * 84)
  const left = percent ?? 100
  const color = left <= style.dangerBelow ? danger : left <= style.warnBelow ? warn : part.color
  const mark =
    timeLeft === null
      ? ''
      : `<rect x="${x + Math.round(timeLeft * 82)}" y="${MID - 8}" width="2.5" height="16" rx="1" fill="${ink}"/>`

  return (
    `<rect x="${x}" y="${MID - 4}" width="84" height="8" rx="4" fill="${ink}" opacity="0.14"/>` +
    `<rect x="${x}" y="${MID - 4}" width="${fill}" height="8" rx="4" fill="${color}"${isStale ? ' opacity="0.4"' : ''}/>` +
    mark
  )
}

function drawPill(parts: Part[], background: string, x: number, style: Style): { svg: string; width: number } {
  let cursor = x + 12
  const drawn = parts.map(part => {
    const svg = drawPart(part, cursor, style)
    cursor += widthOf(part) + 8

    return svg
  })
  const width = cursor - 8 + 12 - x

  return {
    svg: `<rect x="${x}" y="${TOP}" width="${width}" height="${PILL}" rx="${PILL / 2}" fill="${background}"/>${drawn.join('')}`,
    width,
  }
}

function windowParts(w: Window, icon: 'gauge' | 'calendar', color: string): Part[] {
  return [
    { icon, color },
    { text: w.label },
    { bar: w, color },
    { text: `${w.percent ?? '--'}%`, isBold: true, isFaded: w.isStale },
    { rule: true },
    { icon: 'clock', color },
    { text: w.left },
  ]
}

export function barSvg(snapshot: Snapshot, counts: Counts, now: number, style: Style): string {
  const { pills: colors, muted } = PALETTES[style.theme]
  // `pill` picks the palette entry; without one the parts sit on the band itself.
  const contents: { pill?: number; parts: (accent: string) => Part[]; gapAfter: number }[] = [
    { pill: 0, parts: accent => windowParts(windowOf('five_hour', snapshot, now, style), 'gauge', accent), gapAfter: 10 },
    { pill: 1, parts: accent => windowParts(windowOf('seven_day', snapshot, now, style), 'calendar', accent), gapAfter: 30 },
    { pill: 2, parts: accent => [{ icon: 'up', color: accent }, { text: formatCount(counts.input), isBold: true }], gapAfter: 10 },
    { pill: 3, parts: accent => [{ icon: 'down', color: accent }, { text: formatCount(counts.output), isBold: true }], gapAfter: 10 },
    { pill: 4, parts: accent => [{ icon: 'layers', color: accent }, { text: formatCount(counts.cache), isBold: true }], gapAfter: 30 },
    { pill: 5, parts: accent => [{ icon: 'coin', color: accent }, { text: formatCost(snapshot.costUsd), isBold: true }], gapAfter: 0 },
  ]

  if (style.showUpdated && snapshot.limits.length > 0) {
    const seven = contents[1]

    if (seven !== undefined) {
      seven.gapAfter = 0
    }

    contents.splice(2, 0, {
      parts: () => [{ icon: 'refresh', color: muted }, { text: formatAge(snapshot, now), color: muted }],
      gapAfter: 18,
    })
  }

  let x = 0
  const drawn = contents.map(content => {
    const { background, accent } = (content.pill === undefined ? undefined : colors[content.pill]) ?? {
      background: 'none',
      accent: muted,
    }
    const { svg, width } = drawPill(content.parts(accent), background, x, style)
    x += width + content.gapAfter

    return svg
  })
  const width = x

  // xmlns is the namespace identifier a standalone SVG must carry to be
  // drawn as an image; it is a name, and nothing is requested from it.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}" ` +
    `font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${FONT}">` +
    `${drawn.join('')}</svg>`
  )
}
