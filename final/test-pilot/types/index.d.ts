// この Mod が $.state に持つ値の宣言。validate はこの宣言でチェックする
// （6-1 でキャッシュは $.store に移したので、$.state には画面に出す値だけを置く）
export type TestRun = {
  summary: string
  isPassed: boolean
  at: number
  output: string
}

declare module 'claude-code' {
  interface PluginState {
    'test-pilot': {
      last: TestRun | null
    }
  }
}
