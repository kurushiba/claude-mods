// この Mod が $.state に持つ値の宣言
export type ModelName = 'opus' | 'sonnet' | 'haiku'

export type BudgetUsage = {
  model: string
  usd: number
}

declare module 'claude-code' {
  interface PluginState {
    'budget-guard': {
      usage: BudgetUsage | null
      lowered: ModelName | null
    }
  }
}
