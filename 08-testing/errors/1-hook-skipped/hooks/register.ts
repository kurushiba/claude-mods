// 8-3①：hook が例外を投げると、その hook は飛ばされて次へ進む（fail-open）。
// Claude に何かコマンドを実行させると、トランスクリプトに
//   hook-skipped: tool.call hook skipped: threw Error: boom
// のような行が出る。直し方：例外の原因を取り除くか、try/catch で受け止める
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('tool.call', async ($, e, next) => {
    throw new Error('boom')
  })
}
