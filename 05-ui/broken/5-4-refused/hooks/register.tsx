// 5-4：わざと不正な描画をする。/playground でペインを開くと何も出ず、トランスクリプトに
//   ui-playground: ui.render (Pane) refused: Text prop "bogusProp" is not allowed; the engine drew its own
// のような行が出る。
// 2つ目の練習：bogusProp を消し、Box の flexDirection を "diagonal" に変えて保存する
import type { Register } from 'claude-code'

const PANE = 'playground'

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'playground', description: 'UI の練習用ペインを開く' })
    return next(e)
  })

  on('command.run', { command: 'playground' }, async ($, e) => {
    await $.ui.open({ id: PANE, title: 'Playground', focus: true, closeOnEscape: true })
    return { text: 'Playground ペインを開きました' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Text bogusProp>存在しない設定を書いた文字</Text>
      </Box>
    )
  })
}
