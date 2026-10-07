// 8-3③：/broken-pane でペインを開くと、描画が不正なので何も出ず
//   refused: ui.render (Pane) refused: Text prop "bogusProp" is not allowed; the engine drew its own
// と出る（5-4 の復習）。直し方：理由に書かれた prop を消す・正しい値にする
import type { Register } from 'claude-code'

const PANE = 'broken-pane'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'broken-pane', description: '不正な描画のペインを開く（8-3 の練習用）' })
    return next(e)
  })

  on('command.run', { command: 'broken-pane' }, async ($, e) => {
    await $.ui.open({ id: PANE, title: 'Broken', focus: true, closeOnEscape: true })
    return { text: 'ペインを開きました' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text bogusProp>表示されない文字</Text>
  })
}
