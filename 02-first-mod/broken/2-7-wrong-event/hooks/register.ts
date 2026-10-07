// 2-7：イベント名の打ち間違い（'tool.call' ではなく 'tool.calls'）
import type { Register } from 'claude-code'

let calls = 0

export const register: Register = (on) => {
  on('tool.calls', async ($, e, next) => {
    calls += 1
    $.ui.invalidate('ui.render')
    return next(e)
  })
}
