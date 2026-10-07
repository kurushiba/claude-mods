// 6-1：キャッシュを $.store に移した Test Pilot の完成版。
// Mod を読み直しても、Claude Code を再起動しても、前回の結果が使われる
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { TestRun } from '../types'

const TEST_COMMAND = /^npm (?:test|t|run test)(?:\s|$)/
const FINISHED = /\[watch-tests\] finished exit=(\d+)\r?\n/
const PANE = 'test-pilot'

// $.store に覚えておくキャッシュの形
type CacheEntry = { hash: string; output: string }

// 画面に出す値は $.state、次回も覚えていてほしい値は $.store
const last = atom({ plugin: 'test-pilot', key: 'last' }, null)

async function workingTreeHash($: EngineInterface): Promise<string> {
  const head = await $.process.run(['git', 'rev-parse', 'HEAD'])
  const diff = await $.process.run(['git', 'diff', 'HEAD', '--', '.'])
  const untracked = await $.process.run(['git', 'ls-files', '--others', '--exclude-standard', '--', '.'])
  if (head.exitCode !== 0 || diff.exitCode !== 0 || untracked.exitCode !== 0) {
    throw new Error('git で状態を調べられませんでした')
  }

  const files = untracked.stdout.split('\n').filter(file => file !== '')
  let untrackedHashes = ''
  if (files.length > 0) {
    const hashed = await $.process.run(['git', 'hash-object', '--', ...files])
    untrackedHashes = files.join('\n') + hashed.stdout
  }

  const bytes = new TextEncoder().encode(head.stdout + diff.stdout + untrackedHashes)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function summarize(output: string): string {
  const passed = Number(output.match(/ℹ pass (\d+)/)?.[1] ?? 0)
  const failed = Number(output.match(/ℹ fail (\d+)/)?.[1] ?? 0)
  return failed > 0 ? `${passed} passed, ${failed} failed` : `${passed} passed`
}

function failureLines(output: string): string[] {
  const start = output.indexOf('✖ failing tests:')
  const body = start >= 0 ? output.slice(start) : output
  return body.split('\n').filter(line => line.trim() !== '')
}

async function recordRun($: EngineInterface, command: string, output: string, isPassed: boolean) {
  const before = await read($, last)
  const run: TestRun = { summary: summarize(output), isPassed, at: await $.clock.now(), output }
  await update($, last, () => run)
  await $.store.set('last', run)

  if (!isPassed) {
    if (before === null || before.isPassed) {
      const opened = await $.ui.open({ id: PANE, title: 'Tests' })
      if (!opened.isPlaced) {
        $.ui.toast('テストが失敗しました。/tests で確認できます')
      }
    }
    return
  }
  try {
    const hash = await workingTreeHash($)
    // コマンドごとにキーを分けて、同時に書いても消し合わないようにする
    await $.store.set(`cache:${command}`, { hash, output })
  } catch {
    // Git で調べられないときは覚えない
  }
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'tests', description: '最新のテスト結果をペインで開く' })

    // 前回のセッションの結果をバンドに出す
    const stored = (await $.store.get('last')) as TestRun | undefined
    if (stored !== undefined) {
      await update($, last, () => stored)
    }

    const started = await next(e)

    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))

    void (async () => {
      try {
        const watcher = $.process.spawn({ argv: ['node', 'scripts/watch-tests.mjs'] })
        let buffer = ''
        for await (const { text } of watcher) {
          buffer += text
          let match
          while ((match = buffer.match(FINISHED)) !== null) {
            const end = match.index ?? 0
            const output = buffer.slice(0, end)
            buffer = buffer.slice(end + match[0].length)
            await recordRun($, 'npm test', output, match[1] === '0')
          }
        }
        const { code } = await watcher.result
        $.ui.log(`test-pilot: 監視スクリプトが終了しました（exit ${code}）`)
      } catch (error) {
        $.ui.log(`test-pilot: 監視スクリプトを起動できませんでした: ${error}`)
      }
    })()

    return started
  })

  // /clear で $.state が初期値に戻ったら、$.store から読み直す
  on('classic.SessionStart', async ($, e, next) => {
    if (e.source === 'clear') {
      const stored = (await $.store.get('last')) as TestRun | undefined
      await update($, last, () => stored ?? null)
    }
    return next(e)
  })

  on('command.run', { command: 'tests' }, async ($, e) => {
    await $.ui.open({ id: PANE, title: 'Tests', focus: true, closeOnEscape: true })
    return { text: 'Tests ペインを開きました' }
  })

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = e.command.trim()
    if (!TEST_COMMAND.test(command)) {
      return next(e)
    }

    let hash: string
    try {
      hash = await workingTreeHash($)
    } catch {
      return next(e)
    }

    const cached = (await $.store.get(`cache:${command}`)) as CacheEntry | undefined
    if (cached !== undefined && cached.hash === hash) {
      const header = `(cached) ${summarize(cached.output)} — 前回のテストからコードが変わっていないため、実行せずに前回の結果を返しています`
      return { result: { stdout: `${header}\n\n${cached.output}`, stderr: '', interrupted: false } }
    }

    const ran = await next(e)
    if (ran.deny === undefined) {
      await recordRun($, command, ran.text ?? '', ran.isError !== true)
    }

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const run = await read($, last)
    if (e.props.hasSurvey || run === null) {
      return next(e)
    }

    const others = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    const minutes = Math.floor(((await $.clock.now()) - run.at) / 60_000)
    const ago = minutes < 1 ? 'たった今' : `${minutes}分前`

    return (
      <Box flexDirection="column">
        {others}
        <Box flexDirection="row" gap={1}>
          <Text color={run.isPassed ? 'green' : 'red'} bold>
            {run.isPassed ? '✓' : '✗'} {run.summary}
          </Text>
          <Text dimColor>（{ago}）</Text>
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const run = await read($, last)

    if (run === null) {
      return <Text dimColor>まだテストを実行していません</Text>
    }

    const lines = failureLines(run.output)
    const room = Math.max(3, (e.viewport?.rows ?? 24) - 8)

    const fix = async () => {
      await $.prompt.submit({
        text: `次のテストが失敗しています。原因を調べて直してください。\n\n${lines.join('\n')}`,
      })
      await $.ui.close({ id: PANE })
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text color={run.isPassed ? 'green' : 'red'} bold>
          {run.isPassed ? '✓' : '✗'} {run.summary}
        </Text>
        {run.isPassed ? (
          <Text dimColor>すべてのテストが通っています</Text>
        ) : (
          <Box flexDirection="column">
            {lines.slice(0, room).map(line => (
              <Text>{line}</Text>
            ))}
          </Box>
        )}
        {!run.isPassed && (
          <Button key="fix" label="Claudeに直させる" hotkey="f" variant="primary" onPress={fix} />
        )}
      </Box>
    )
  })
}
