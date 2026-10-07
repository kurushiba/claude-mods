// 失敗例：session.start をマッチャーなしで2回登録すると、読み込みに失敗する
import type { Register } from 'claude-code'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    $.ui.log('1つ目')
    return next(e)
  })

  on('session.start', async ($, e, next) => {
    $.ui.log('2つ目')
    return next(e)
  })
}
