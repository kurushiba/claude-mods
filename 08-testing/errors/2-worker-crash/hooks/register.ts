// 8-3②：/spin を実行すると無限ループになり、Mod を動かす裏の処理（hooks worker）が止まる。
//   ... it crashed the hooks worker
// と出て、この Mod は外される。3回続くとすべての Mod が止まるので、/reload-plugins で戻す。
// ※ 試すのは --plugin-dir で読み込んだ練習用のセッションだけにすること
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'spin', description: 'わざと無限ループを起こす（8-3 の練習用）' })
    return next(e)
  })

  on('command.run', { command: 'spin' }, async ($, e) => {
    while (true) {
      // 何もしないで回り続ける
    }
  })
}
