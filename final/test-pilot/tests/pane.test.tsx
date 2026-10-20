import { expect, mock, test } from 'claude-code/testing'

const FAILED = [
  '✖ adds shipping under 5000 yen',
  'ℹ tests 42',
  'ℹ pass 41',
  'ℹ fail 1',
  '✖ failing tests:',
  '✖ adds shipping under 5000 yen',
  '  AssertionError: 3520 !== 4020',
].join('\n')

const PANE = { component: 'Pane' as const, requestId: 'test-pilot', props: { title: 'Tests', bodyColumns: 80 } }

test('失敗したテストをペインに出し、自分からペインを開く', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  const opened: string[] = []
  on('ui.open', (_$, e) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('tool.call', () => ({
    result: { stdout: FAILED, stderr: '', interrupted: false },
    text: FAILED,
    isError: true,
  }))

  // テストを失敗させると、Mod が自分からペインを開く
  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(opened).toEqual(['test-pilot'])

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'test-pilot', surface, ...PANE } as never)
    expect(await ui.find({ type: 'Text', text: /41 passed, 1 failed/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /AssertionError/ })).toBeDefined()
    await ui.unmount()
  }
})
