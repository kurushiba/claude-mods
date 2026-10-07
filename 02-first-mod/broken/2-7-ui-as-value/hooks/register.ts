// 2-7：窓口を変数に入れると、validate が一覧を作れずエラーになる
import type { Register } from 'claude-code'

let calls = 0

export const register: Register = (on) => {
  on('tool.call', async ($, e, next) => {
    calls += 1
    const ui = $.ui
    ui.invalidate('ui.render')
    return next(e)
  })
}
