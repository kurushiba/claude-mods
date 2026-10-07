import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PASSED = '✔ adds\nℹ tests 42\nℹ pass 42\nℹ fail 0\n'
const FAILED = '✖ adds\nℹ tests 42\nℹ pass 41\nℹ fail 1\n'

// git をスタブにする。diff の中身を書き換えると「コードが変わった」ことになる
function stubGit(on: On, state: { diff: string }) {
  on('process.run', (_$, e) => {
    const [, sub] = e.argv
    const stdout = sub === 'rev-parse' ? 'abc123\n' : sub === 'diff' ? state.diff : ''
    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
}

// npm test をスタブにする。実行された回数を数える
function stubTests(on: On, outcome: { output: string; isError: boolean }) {
  const runs = { count: 0 }
  on('tool.call', () => {
    runs.count += 1
    const result = { stdout: outcome.output, stderr: '', interrupted: false }
    return outcome.isError
      ? { result, text: outcome.output, isError: true }
      : { result, text: outcome.output }
  })
  return runs
}

test('コードが変わっていなければ、実行せずに (cached) を返す', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  stubGit(on, { diff: '' })
  const runs = stubTests(on, { output: PASSED, isError: false })

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  const second = await $.tool.call({ tool: 'Bash', command: 'npm test' })

  expect(runs.count).toBe(1)
  expect(JSON.stringify(second.result)).toContain('(cached) 42 passed')
})

test('コードが変わったら、もう一度実行する', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  const git = { diff: '' }
  stubGit(on, git)
  const runs = stubTests(on, { output: PASSED, isError: false })

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  git.diff = '+ changed line\n'
  await $.tool.call({ tool: 'Bash', command: 'npm test' })

  expect(runs.count).toBe(2)
})

test('失敗した結果はキャッシュしない', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  stubGit(on, { diff: '' })
  const runs = stubTests(on, { output: FAILED, isError: true })

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Bash', command: 'npm test' })

  expect(runs.count).toBe(2)
})

test('引数が違えば別のコマンドとして実行する', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  stubGit(on, { diff: '' })
  const runs = stubTests(on, { output: PASSED, isError: false })

  await $.tool.call({ tool: 'Bash', command: 'npm test' })
  await $.tool.call({ tool: 'Bash', command: 'npm test -- auth' })

  expect(runs.count).toBe(2)
})

test('テスト以外のコマンドには何もしない', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  stubGit(on, { diff: '' })
  const runs = stubTests(on, { output: 'file.txt\n', isError: false })

  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Bash', command: 'ls' })

  expect(runs.count).toBe(2)
})
