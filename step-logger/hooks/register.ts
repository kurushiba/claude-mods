// 6-4・6-5 で使う：モデルへのリクエスト1回ごとに届く turn.step を記録するだけの Mod。
// turn.step は応答が少しずつ流れてくるので、async function*（async generator）で書く
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('turn.step', async function* ($, e, next) {
    // 応答を流しながら、最後の結果を受け取る
    const result = yield* next(e)

    const who = e.agentId === undefined ? 'main' : `sub ${e.agentId.slice(0, 8)}`
    const answered = result.usage?.model ?? '?'
    $.ui.log(`step ${e.index} [${who}] 指定 ${e.model} → 回答 ${answered}`)

    return result
  })
}
