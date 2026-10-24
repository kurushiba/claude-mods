import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

// サブエージェントの起動を、Claude Code 本体の代わりに受け取る（指定されたモデルを記録する）
function stubSpawn(on: On) {
  const models: (string | undefined)[] = []
  on('agent.spawn', (_$, e) => {
    models.push(e.model)
    return { model: e.model ?? 'inherit', agentId: `agent-${models.length}` }
  })
  return models
}

function spawnInput(subagentType: string, description: string, fork = false) {
  return {
    tool_use_id: 'toolu_1',
    prompt: description,
    description,
    subagentType,
    provider: { plugin: 'engine', tier: 'core' },
    background: false,
    fork,
  }
}

// モデルへのリクエストを、Claude Code 本体の代わりに受け取る（指定されたモデルで答えたことにする）
function stubStep(on: On) {
  const models: string[] = []
  on('turn.step', async function* (_$, e) {
    models.push(e.model)
    return {
      turnId: e.turnId,
      index: e.index,
      answer: '',
      toolUses: [],
      stopReason: 'end_turn',
      usage: { model: e.model, input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    }
  })
  return models
}

async function step($: any, agentId?: string, model = 'claude-opus-5-5') {
  const stream = $.turn.step({ turnId: 't1', index: 0, model, messageCount: 1, agentId })
  for await (const _chunk of stream) {
    // 応答の断片は読み捨てる
  }
  return stream.result
}

// セッションのコストを、Claude Code 本体の代わりに答える
function stubUsage(on: On, usd: number) {
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200_000, percent: 30 },
      rateLimits: [],
      cost: { usd },
    },
  }))
}

// 予算を $.store に入れた状態にし、セッションを始める役を用意する（スタブは $ を呼ぶ前に登録する）
function stubBudget(on: On, budget: number) {
  mock.store(on, { budget })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'budget' } }))
}

async function start($: any) {
  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
}

test('予算の70%までは、サブエージェントのモデルを変えない', async ($, on) => {
  stubBudget(on, 0.5)
  stubUsage(on, 0.3)
  const models = stubSpawn(on)

  await start($)
  await $.agent.spawn(spawnInput('Explore', '関数の使用箇所を調べる') as never)

  expect(models).toEqual([undefined])
})

test('予算の70%を超えたら、サブエージェントを Haiku にする（フォークは変えない）', async ($, on) => {
  stubBudget(on, 0.5)
  stubUsage(on, 0.36)
  const models = stubSpawn(on)

  await start($)
  await $.agent.spawn(spawnInput('Explore', '関数の使用箇所を調べる') as never)
  await $.agent.spawn(spawnInput('general-purpose', 'テストを修正する') as never)
  await $.agent.spawn(spawnInput('fork', '続きを進める', true) as never)

  expect(models).toEqual(['haiku', 'haiku', undefined])
})

test('/budget 0.50 で予算を $.store に保存する', async ($, on) => {
  const saved: Record<string, unknown> = {}
  on('store.get', () => ({ value: undefined }))
  on('store.set', (_$, e) => {
    saved[e.key] = e.value
    return { value: undefined }
  })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'budget' } }))
  on('ui.invalidate', () => ({ value: undefined }))

  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const { text } = await $.command.run({
    command: 'budget',
    args: '0.50',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })

  expect(text).toContain('$0.50')
  expect(saved.budget).toBe(0.5)
})

test('予算の90%を超えたら、メインだけ1段下に切り替え、知らせるのは1回だけ', async ($, on) => {
  stubBudget(on, 0.5)
  stubUsage(on, 0.46)
  const models = stubStep(on)
  const toasts: string[] = []
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })

  await start($)
  await step($)
  await step($)
  await step($, 'agent-1')

  expect(toasts.length).toBe(1)
  expect(models).toEqual(['claude-sonnet-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'])
})

test('バンドにモデル・予算バー・コストを出す', async ($, on) => {
  stubBudget(on, 0.5)
  stubUsage(on, 0.3)
  stubStep(on)
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  await start($)
  await step($)

  const ui = await $.ui.mount({
    plugin: 'budget-guard',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80 },
  } as never)
  expect(await ui.find({ type: 'Text', text: 'opus' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '######----' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '$0.30 / $0.50' })).toBeDefined()
})
