import type { EngineInterface, Register } from 'claude-code'

const TEST_COMMAND = /^npm (?:test|t|run test)(?:\s|$)/

type CacheEntry = { hash: string; output: string }

let cache: Record<string, CacheEntry> = {}

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

export const register: Register = (on) => {
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

    const cached = cache[command]
    if (cached !== undefined && cached.hash === hash) {
      return { result: { stdout: cached.output, stderr: '', interrupted: false } }
    }

    const ran = await next(e)
    if (ran.deny === undefined && ran.isError !== true) {
      cache = { ...cache, [command]: { hash, output: ran.text ?? '' } }
    }

    return ran
  })
}
