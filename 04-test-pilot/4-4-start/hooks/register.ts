import type { EngineInterface, Register } from 'claude-code'

const NPM_TEST = /^\s*npm\s+(test|t|run\s+test)\s*$/

export const register: Register = on => {
  let last: { hash: string; result: unknown } | undefined

  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!NPM_TEST.test(e.command)) return next(e)

    const hash = await stateHash($)
    if (hash === undefined) return next(e)

    if (last?.hash === hash) return { result: last.result } as never

    const ran = await next(e)
    if (ran.deny === undefined) last = { hash, result: ran.result }
    return ran
  })
}

async function git($: EngineInterface, argv: string[], stdin?: string): Promise<string> {
  const r = await $.process.run(['git', ...argv], stdin === undefined ? undefined : { stdin })
  if (r.exitCode !== 0) throw new Error(`git ${argv[0]} failed`)
  return r.stdout
}

// One hash from HEAD plus every uncommitted change (tracked diff and untracked names).
async function stateHash($: EngineInterface): Promise<string | undefined> {
  try {
    const head = await git($, ['rev-parse', 'HEAD'])
    const diff = await git($, ['diff', 'HEAD'])
    const untracked = await git($, ['ls-files', '--others', '--exclude-standard'])
    const hash = await git($, ['hash-object', '--stdin'], `${head}\n${diff}\n${untracked}`)
    return hash.trim() || undefined
  } catch {
    return undefined
  }
}
