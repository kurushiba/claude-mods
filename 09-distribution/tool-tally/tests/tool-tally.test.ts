import { expect, test } from 'claude-code/testing'

test('/tally は道具を使った回数を答える', async ($, on) => {
  // スタブ：本物の Bash は動かさず、決まった結果を返す
  on('tool.call', () => ({ result: 'ok' }))

  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })

  // 人が入力欄で /tally と打ったときと同じ入力で、コマンドを起こす
  const { text } = await $.command.run({
    command: 'tally',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(text).toContain('2 tool calls')
})
