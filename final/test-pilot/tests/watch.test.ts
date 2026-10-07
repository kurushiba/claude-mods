import { expect, mock, test } from 'claude-code/testing'

// テストの実行環境には setTimeout があるが、Mod 用の型定義（DOM も Node もない）には載っていない
declare function setTimeout(callback: () => void, ms: number): unknown

const PASSED = '✔ adds\nℹ tests 42\nℹ pass 42\nℹ fail 0\n'

test('常駐監視の結果がキャッシュに入り、npm test を実行せずに答える', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  // git の役。指紋を作るたびに呼ばれるので、回数でキャッシュの書き込みを待てる
  let gitCalls = 0
  on('process.run', () => {
    gitCalls += 1
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('command.register', () => ({ value: { command: 'tests' } }))
  on('ui.log', () => ({ value: undefined }))

  // 監視スクリプトの役：出力を少しずつ流し、最後に区切りの行を出して終わる
  on('process.spawn', async function* () {
    yield { stream: 'stdout' as const, text: PASSED.slice(0, 10) }
    yield { stream: 'stdout' as const, text: PASSED.slice(10) + '[watch-tests] fin' }
    yield { stream: 'stdout' as const, text: 'ished exit=0\n' }
    return { value: { code: 0, signal: null } }
  })

  let runs = 0
  on('tool.call', () => {
    runs += 1
    return { result: { stdout: PASSED, stderr: '', interrupted: false }, text: PASSED }
  })

  // session.start はテストでは自動で起きないので、自分で起こす（本体の役も用意する）
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp/sample-app', surface: null, isInteractive: false })

  // 裏で動く読み取りが終わるのを待つ
  for (let i = 0; i < 50 && gitCalls < 3; i++) {
    await new Promise<void>(resolve => setTimeout(resolve, 10))
  }
  await new Promise<void>(resolve => setTimeout(resolve, 20))

  const answer = await $.tool.call({ tool: 'Bash', command: 'npm test' })
  expect(runs).toBe(0)
  expect(JSON.stringify(answer.result)).toContain('(cached) 42 passed')
})
