// 6-12：Budget Guard の完成版。/budget で決めた予算に対して、
// 70%を超えたらサブエージェントを Haiku に、90%を超えたらメインを1段下のモデルに切り替える。
// 入力欄の上のバンドに「opus ######---- $0.31 / $0.50」のように、今のモデル・予算バー・推定コストを出す
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import type { ModelName } from '../types'

// 予算のうち、どこまで使ったら切り替えるか
const SUBAGENT_AT = 0.7
const MAIN_AT = 0.9

const MODELS: Record<ModelName, string> = {
  opus: 'claude-opus-5-5',
  sonnet: 'claude-sonnet-5-5',
  haiku: 'claude-haiku-5-5',
}

// メインの切り替え先（1段下のモデル）
const LOWER: Partial<Record<ModelName, ModelName>> = { opus: 'sonnet', sonnet: 'haiku' }

const usage = atom({ plugin: 'budget-guard', key: 'usage' }, null)
// メインを切り替えた先。一度切り替えたら戻さない（Mod を読み直しても消えないよう $.state に置く）
const lowered = atom({ plugin: 'budget-guard', key: 'lowered' }, null)

// 予算（ドル）。undefined なら予算なし
let budget: number | undefined

// モデル ID から別名を探す（claude-opus-5-5 → opus）
function findName(id: string): ModelName | undefined {
  return (Object.keys(MODELS) as ModelName[]).find(name => id.includes(name))
}

// 予算のうち使った割合（予算がなければ 0）
async function usedRate($: EngineInterface): Promise<number> {
  if (budget === undefined) {
    return 0
  }
  const now = await $.session.usage()
  return (now.cost?.usd ?? 0) / budget
}

// 10マスのバー（# が使った分）
function bar(rate: number): string {
  const filled = Math.min(10, Math.round(rate * 10))
  return '#'.repeat(filled) + '-'.repeat(10 - filled)
}

function barColor(rate: number): string {
  if (rate >= MAIN_AT) return 'red'
  if (rate >= SUBAGENT_AT) return 'yellow'
  return 'green'
}

// セッションの使用状況を読んで $.state に入れる（バンドは自動で描き直される）
async function refreshUsage($: EngineInterface, model: string) {
  const now = await $.session.usage()
  await update($, usage, () => ({ model, usd: now.cost?.usd ?? 0 }))
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    budget = (await $.store.get('budget')) as number | undefined
    await $.command.register({
      name: 'budget',
      description: 'このセッションの予算（ドル）を決める（例：/budget 0.50、off で外す）',
      argumentHint: '[金額|off]',
      immediate: true,
    })
    return next(e)
  })

  on('command.run', { command: 'budget' }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()

    if (arg === '') {
      return { text: budget === undefined ? '予算は決めていません' : `予算は $${budget.toFixed(2)} です` }
    }
    if (arg === 'off') {
      budget = undefined
      await $.store.delete('budget')
      // budget は $.state ではないので、描き直しを頼む
      $.ui.invalidate('ui.render')
      return { text: '予算を外しました' }
    }

    const usd = Number(arg.replace('$', ''))
    if (!Number.isFinite(usd) || usd <= 0) {
      return { text: '使い方：/budget 0.50 | off' }
    }
    budget = usd
    await $.store.set('budget', usd)
    $.ui.invalidate('ui.render')
    return { text: `予算を $${usd.toFixed(2)} にしました` }
  })

  on('agent.spawn', async ($, e, next) => {
    if (e.fork || (await usedRate($)) < SUBAGENT_AT) {
      return next(e)
    }
    $.ui.log(`予算の${SUBAGENT_AT * 100}%を超えたので、「${e.description}」を Haiku で動かします`)
    return next({ ...e, model: 'haiku' })
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) {
      return yield* next(e)
    }

    let to = await read($, lowered)
    if (to === null && (await usedRate($)) >= MAIN_AT) {
      const current = findName(e.model)
      const lower = current === undefined ? undefined : LOWER[current]
      if (lower !== undefined) {
        to = lower
        await update($, lowered, () => lower)
        $.ui.toast(`予算の${MAIN_AT * 100}%を超えました。メインを ${lower} に切り替えます`)
      }
    }

    const step = to === null ? e : { ...e, model: MODELS[to] }
    const result = yield* next(step)
    await refreshUsage($, result.usage?.model ?? step.model)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const now = await read($, usage)
    const to = await read($, lowered)
    if (e.props.hasSurvey || now === null) {
      return next(e)
    }

    const others = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    const rate = budget === undefined ? 0 : now.usd / budget

    return (
      <Box flexDirection="column">
        {others}
        <Box flexDirection="row" gap={1}>
          <Text bold>{findName(now.model) ?? now.model}</Text>
          {budget !== undefined && <Text color={barColor(rate)}>{bar(rate)}</Text>}
          <Text dimColor>
            {budget === undefined ? `$${now.usd.toFixed(2)}` : `$${now.usd.toFixed(2)} / $${budget.toFixed(2)}`}
          </Text>
          {to !== null && <Text dimColor>（{to} に切り替え済み）</Text>}
        </Box>
      </Box>
    )
  })
}
