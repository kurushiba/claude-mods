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

function spawnInput(subagentType: string, description: string) {
  return {
    tool_use_id: 'toolu_1',
    prompt: description,
    description,
    subagentType,
    provider: { plugin: 'engine', tier: 'core' },
    background: false,
    fork: false,
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

async function step($: any, agentId?: string) {
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'claude-opus-5-5', messageCount: 1, agentId })
  for await (const _chunk of stream) {
    // 応答の断片は読み捨てる
  }
  return stream.result
}

function stubUsage(on: On, percentUsed: number) {
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200_000, percent: 62 },
      rateLimits: [{ kind: 'five_hour', percentUsed, source: 'api' }],
      cost: { usd: 0.41 },
    },
  }))
}

test('調査系のサブエージェントは Haiku、実装系はそのまま', async ($, on) => {
  const models = stubSpawn(on)

  await $.agent.spawn(spawnInput('Explore', '関数の使用箇所を調べる') as never)
  await $.agent.spawn(spawnInput('general-purpose', 'ファイル一覧を作る') as never)
  await $.agent.spawn(spawnInput('general-purpose', '検索機能を実装する') as never)
  await $.agent.spawn(spawnInput('general-purpose', 'テストを修正する') as never)

  expect(models).toEqual(['haiku', 'haiku', undefined, undefined])
})

test('システムプロンプトの末尾に、切り出しの指示を足す', async ($, on) => {
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'You are Claude Code.', scope: 'shared' as const }] }))

  const { sections } = await $.prompt.compose({
    model: 'claude-opus-5-5',
    promptModel: 'claude-opus-5-5',
    surfaces: [],
    tools: [],
    outputStyle: null,
    traits: [],
  })

  expect(sections.at(-1)?.id).toBe('model-router:delegation')
  expect(sections.at(-1)?.scope).toBe('session')
})

test('/route sonnet でメインだけ Sonnet に固定する', async ($, on) => {
  mock.store(on)
  stubUsage(on, 10)
  const models = stubStep(on)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'route' } }))

  await $.session.start({ cwd: '/tmp', surface: null, isInteractive: false })
  const { text } = await $.command.run({
    command: 'route',
    args: 'sonnet',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
  await step($)
  await step($, 'agent-1')

  expect(text).toContain('sonnet')
  expect(models).toEqual(['claude-sonnet-5-5', 'claude-opus-5-5'])
})

test('バンドにモデル・天気・コストを出す', async ($, on) => {
  mock.store(on)
  stubUsage(on, 10)
  stubStep(on)
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  await step($)

  const ui = await $.ui.mount({
    plugin: 'model-router',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80 },
  } as never)
  expect(await ui.find({ type: 'Text', text: 'Opus' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '☂ 62%' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '$0.41' })).toBeDefined()
})

test('利用上限の80%を超えたら知らせて、メインを下位のモデルに固定する', async ($, on) => {
  mock.store(on)
  stubUsage(on, 85)
  const models = stubStep(on)
  const toasts: string[] = []
  on('ui.toast', (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.invalidate', () => ({ value: undefined }))

  await step($)
  await step($)

  expect(toasts.length).toBe(1)
  expect(models).toEqual(['claude-opus-5-5', 'claude-sonnet-5-5'])
})
