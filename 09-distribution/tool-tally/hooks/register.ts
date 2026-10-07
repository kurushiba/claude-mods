import type { Register } from 'claude-code'

let calls = 0

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tally',
      description: 'Claude が道具を使った回数を表示する',
    })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    calls += 1
    $.ui.invalidate('ui.render')
    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const suffix = ' · tools used: ' + calls + '…'
    return next({ ...e, props: { ...e.props, suffix } })
  })

  on('command.run', { command: 'tally' }, async ($, e) => {
    return { text: `Claude has made ${calls} tool calls since this mod loaded` }
  })
}
