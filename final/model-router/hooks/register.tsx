// 7-5：Model Router の完成版。入力欄の上のバンドに「Opus ☂ 62% $0.41」のように、
// 今のモデル・コンテキストの使用率を天気で表したもの・推定コストを出す。
// プランの利用上限の使用率が80%を超えたら知らせて、メインを下位のモデルに固定する
import { atom, read, update } from 'claude-code'
import type { AgentSpawnInput, EngineInterface, PromptComposeSection, Register } from 'claude-code'

const DELEGATION: PromptComposeSection = {
  id: 'model-router:delegation',
  text: [
    '# Delegation',
    'Delegate research, code search, file exploration and summarizing to an Explore subagent with the Agent tool.',
    'Do implementation and design decisions yourself.',
  ].join('\n'),
  scope: 'session',
}

const RESEARCH = /調べ|探し|探索|検索|一覧|要約|調査|洗い出|\b(research|search|find|list|explore|investigate|summari[sz]e|look up|locate)\b/i
const IMPLEMENTATION = /実装|修正|変更|書き換|作成|追加|\b(implement|fix|change|edit|write|refactor|add)\b/i

type ModelName = 'opus' | 'sonnet' | 'haiku'

const MODELS: Record<ModelName, string> = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-4-5-20251001',
}

// 利用上限が近づいたときに切り替える先
const LOWER: Partial<Record<ModelName, ModelName>> = { opus: 'sonnet', sonnet: 'haiku' }
const RATE_LIMIT_WARNING = 80

const usage = atom({ plugin: 'model-router', key: 'usage' }, null)

let route: ModelName | undefined
let isWarned = false

function isResearch(e: AgentSpawnInput): boolean {
  if (IMPLEMENTATION.test(e.description)) {
    return false
  }
  return e.subagentType === 'Explore' || RESEARCH.test(e.description)
}

// モデル ID から表示用の名前を作る（claude-opus-5-5 → Opus）
function modelName(id: string): string {
  const found = Object.keys(MODELS).find(name => id.includes(name))
  return found === undefined ? id : found.charAt(0).toUpperCase() + found.slice(1)
}

// コンテキストの使用率を天気で表す
function weather(percent: number): string {
  if (percent < 50) return '☀'
  if (percent < 80) return '☂'
  return '↯'
}

async function setRoute($: EngineInterface, choice: ModelName | undefined) {
  route = choice
  if (choice === undefined) {
    await $.store.delete('route')
  } else {
    await $.store.set('route', choice)
  }
  // route は $.state ではないので、描き直しを頼む
  $.ui.invalidate('ui.render')
}

// セッションの使用状況を読んで $.state に入れる（バンドは自動で描き直される）
async function refreshUsage($: EngineInterface, model: string) {
  const now = await $.session.usage()
  await update($, usage, () => ({
    model,
    contextPercent: Math.round(now.context.percent ?? 0),
    usd: now.cost?.usd ?? 0,
  }))

  const highest = Math.max(0, ...now.rateLimits.map(limit => limit.percentUsed))
  if (highest < RATE_LIMIT_WARNING || isWarned) {
    return
  }
  isWarned = true

  const names = Object.keys(MODELS) as ModelName[]
  const current = route ?? names.find(name => model.includes(name))
  const lower = current === undefined ? undefined : LOWER[current]
  if (lower === undefined) {
    $.ui.toast(`利用上限の ${Math.round(highest)}% を使いました`)
    return
  }
  await setRoute($, lower)
  $.ui.toast(`利用上限の ${Math.round(highest)}% を使いました。メインを ${lower} に固定します`)
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    route = (await $.store.get('route')) as ModelName | undefined
    await $.command.register({
      name: 'route',
      description: 'メインの会話のモデルを固定する（opus / sonnet / haiku / off）',
      argumentHint: '[opus|sonnet|haiku|off]',
      immediate: true,
    })
    return next(e)
  })

  on('command.run', { command: 'route' }, async ($, e) => {
    const choice = e.args.trim().toLowerCase()

    if (choice === '') {
      return { text: route === undefined ? 'メインのモデルは固定していません' : `メインのモデルは ${route} に固定しています` }
    }
    if (choice === 'off') {
      await setRoute($, undefined)
      return { text: 'メインのモデルの固定を外しました' }
    }
    if (choice !== 'opus' && choice !== 'sonnet' && choice !== 'haiku') {
      return { text: '使い方：/route opus | sonnet | haiku | off' }
    }

    await setRoute($, choice)
    return { text: `メインのモデルを ${choice} に固定しました（次のリクエストから）` }
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    return { ...composed, sections: [...composed.sections, DELEGATION] }
  })

  on('agent.spawn', async ($, e, next) => {
    if (e.fork || !isResearch(e)) {
      return next(e)
    }
    $.ui.log(`model-router: 「${e.description}」を Haiku で動かします`)
    return next({ ...e, model: 'haiku' })
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) {
      return yield* next(e)
    }

    const step = route === undefined ? e : { ...e, model: MODELS[route] }
    const result = yield* next(step)
    await refreshUsage($, result.usage?.model ?? step.model)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, usage)
    if (e.props.hasSurvey || now === null) {
      return next(e)
    }

    const others = await next(e)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {others}
        <Box flexDirection="row" gap={1}>
          <Text bold>{modelName(now.model)}</Text>
          <Text>
            {weather(now.contextPercent)} {now.contextPercent}%
          </Text>
          <Text dimColor>${now.usd.toFixed(2)}</Text>
          {route !== undefined && <Text dimColor>（{route} に固定中）</Text>}
        </Box>
      </Box>
    )
  })
}
