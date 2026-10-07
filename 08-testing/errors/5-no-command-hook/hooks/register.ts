// 8-3⑤：/hello を登録したのに、答える hook のマッチャーが 'helo' になっている。
// /hello を実行すると「no command.run hook answered it」と出る。
// 直し方：マッチャーの名前を登録した名前（hello）と同じにする
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'hello', description: 'あいさつを返す' })
    return next(e)
  })

  on('command.run', { command: 'helo' }, async ($, e) => {
    return { text: 'こんにちは！' }
  })
}
