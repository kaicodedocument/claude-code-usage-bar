export type Limit = { kind: string; percentUsed: number; resetsAt: string | null }

// `limitsAt` is when the limits were read, in `$.clock.now()`'s milliseconds; null when unknown.
export type Snapshot = { limits: Limit[]; limitsAt: number | null; costUsd: number | null }

export type Tokens = { input: number; output: number; cache: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-bar': { snapshot: Snapshot; tokens: Tokens; isHidden: boolean }
  }
}
