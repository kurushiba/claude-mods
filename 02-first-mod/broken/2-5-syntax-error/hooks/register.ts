// 2-5：わざと文法エラー（閉じカッコが足りない）。保存すると
// "reload failed, the previous version stays loaded" と出て、直前の版が動き続ける
import type { Register } from 'claude-code'

let calls = 0

export const register: Register = (on) => {
  on('tool.call', async ($, e, next) => {
    calls += 1
    $.ui.invalidate('ui.render')
    return next(e)
  }

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const suffix = ' · tools used: ' + calls + '…'
    return next({ ...e, props: { ...e.props, suffix } })
  })
}
