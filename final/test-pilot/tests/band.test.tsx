import { expect, mock, test } from 'claude-code/testing'

const PASSED = '✔ adds\nℹ tests 42\nℹ pass 42\nℹ fail 0\n'
const BAND = {
  component: 'AbovePrompt' as const,
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80 },
}

test('バンドに最新のテスト結果を出す', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  // Claude Code 本体のバンドの役（本体はバンドに何も描かない）
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('tool.call', () => ({ result: { stdout: PASSED, stderr: '', interrupted: false }, text: PASSED }))

  await $.tool.call({ tool: 'Bash', command: 'npm test' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'test-pilot', surface, ...BAND } as never)
    expect(await ui.find({ type: 'Text', text: /42 passed/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /たった今/ })).toBeDefined()
    await ui.unmount()
  }
})
