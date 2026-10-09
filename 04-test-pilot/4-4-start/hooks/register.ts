import type { EngineInterface, Register } from 'claude-code'

const TEST_COMMAND = /^npm (?:test|t|run test)(?:\s|$)/

// 前回の { hash, output }
type CacheEntry = { hash: string; output: string }

let cache: CacheEntry | null = null

// 作業中のファイルの状態から「指紋」を作る。内容が同じなら同じ値になる
async function workingTreeHash($: EngineInterface): Promise<string> {
  const head = await $.process.run(['git', 'rev-parse', 'HEAD'])
  const diff = await $.process.run(['git', 'diff', 'HEAD', '--', '.'])
  if (head.exitCode !== 0 || diff.exitCode !== 0) {
    throw new Error('git で状態を調べられませんでした')
  }

  const bytes = new TextEncoder().encode(head.stdout + diff.stdout)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export const register: Register = (on) => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!TEST_COMMAND.test(e.command.trim())) {
      return next(e)
    }

    let hash: string
    try {
      hash = await workingTreeHash($)
    } catch {
      return next(e)
    }

    // 変更がなければ、実行せずに前回の出力を返す
    if (cache !== null && cache.hash === hash) {
      return { result: { stdout: cache.output, stderr: '', interrupted: false } }
    }

    // 変更があれば普通に実行し、結果とハッシュを覚えておく
    const ran = await next(e)
    if (ran.deny === undefined) {
      cache = { hash, output: ran.text ?? '' }
    }

    return ran
  })
}
