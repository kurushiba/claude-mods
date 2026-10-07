// この Mod が $.state に持つ値の宣言
export type RouterUsage = {
  model: string
  contextPercent: number
  usd: number
}

declare module 'claude-code' {
  interface PluginState {
    'model-router': {
      usage: RouterUsage | null
    }
  }
}
