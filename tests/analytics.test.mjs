import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
import { setImmediate } from 'node:timers/promises'
import { createRequire } from 'node:module'

// 추가 테스트 패키지나 실제 Amplitude 전송 없이 순수 이벤트 흐름을 검증한다.
async function loadTypeScript(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const { createCorrectionFlow, flowIdFromState } = await loadTypeScript('../src/analytics/correctionFlow.ts')
const { screenForPath } = await loadTypeScript('../src/analytics/events.ts')
const flowId = 'bda7d9c4-b5da-4e91-a772-92bfb2590d8a'
const toolContext = { source: 'toolbar', tab: 'ai', next_tab: 'manual', tool: 'UNDERLINE', kind: 'RED' }

function capture() {
  const events = []
  let time = 0
  const flow = createCorrectionFlow((name, properties) => events.push({ name, ...properties }), flowId, () => time)
  return { flow, events, advance: ms => { time += ms } }
}

test('StrictMode 등의 중복 단계 호출은 빼고, 재진입과 소요 시간은 기록한다', () => {
  const { flow, events, advance } = capture()
  flow.view('upload')
  advance(500)
  flow.view('upload')
  advance(500)
  flow.view('settings')
  flow.view('generation')
  flow.view('settings')
  assert.deepEqual(events.map(e => e.step), ['upload', 'settings', 'generation', 'settings'])
  assert.equal(events[1].previous_step_ms, 1000)
  assert.equal(events[3].previous_step, 'generation')
  assert.ok(events.every(e => e.flow_id === flowId))
})

test('탭보다 도구를 먼저 누르면 후속 탭 전환에도 첫 진입 경로가 tool이다', () => {
  const { flow, events } = capture()
  flow.manual('tool_selected', toolContext)
  flow.manual('tab_selected', { ...toolContext, source: 'tabs', tab: 'manual' })
  flow.manual('region_selected', { ...toolContext, source: 'canvas', tab: 'manual' })
  flow.manual('saved', { ...toolContext, source: 'panel', tab: 'manual' })
  assert.deepEqual(events.map(e => e.first_entry), ['tool', 'tool', 'tool', 'tool'])
  assert.deepEqual(events.map(e => e.sequence), [1, 2, 3, 4])
  assert.equal(events[1].previous_action, 'tool_selected')
  assert.ok(events.every(e => e.manual_session_id === events[0].manual_session_id))
})

test('탭을 먼저 눌렀을 때 기본 도구가 켜져 있어도 tool 우선으로 바뀌지 않는다', () => {
  const { flow, events } = capture()
  flow.manual('tab_selected', { ...toolContext, source: 'tabs', tool: null })
  flow.manual('tool_selected', { ...toolContext, source: 'panel', tab: 'manual', tool: 'CARET' })
  flow.manual('save_requested', { ...toolContext, source: 'panel', tab: 'manual' })
  flow.manual('save_failed', { ...toolContext, source: 'panel', tab: 'manual' })
  assert.ok(events.every(e => e.first_entry === 'tab'))
  assert.equal(events.at(-1).action, 'save_failed')
  assert.ok(!events.some(e => e.action === 'saved'))
})

test('AI 탭이나 도구 끄기를 수기 첨삭 첫 진입으로 세지 않는다', () => {
  const { flow, events } = capture()
  flow.manual('tab_selected', { ...toolContext, source: 'tabs', next_tab: 'ai', tool: null })
  flow.manual('tool_selected', { ...toolContext, next_tab: 'ai', tool: null })
  assert.ok(events.every(e => e.first_entry === null))
})

test('업로드와 검토 사이에는 흐름 ID를 유지하고 검토 회차는 분리한다', () => {
  const { flow, events } = capture()
  flow.manual('tool_selected', toolContext)
  const next = createCorrectionFlow((name, properties) => events.push({ name, ...properties }), flowIdFromState({ correctionFlowId: flow.id }))
  next.view('review')
  next.manual('tool_selected', toolContext)
  assert.equal(events[2].flow_id, flowId)
  assert.notEqual(events[0].manual_session_id, events[2].manual_session_id)
  assert.equal(events[2].sequence, 1)
})

test('화면 이벤트에 URL·학습지 ID를 넣지 않고 흐름 ID도 UUID만 허용한다', () => {
  assert.equal(screenForPath('/corrections/review/204'), 'correction_review')
  assert.equal(screenForPath('/qr-login'), 'qr_login')
  assert.equal(flowIdFromState({ correctionFlowId: 'secret@example.com' }), undefined)
  assert.equal(flowIdFromState(null), undefined)
  assert.equal(flowIdFromState({ correctionFlowId: flowId }), flowId)
})

async function clientWithStub(env, stub) {
  const source = await readFile(new URL('../src/analytics/client.ts', import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  })
  const code = `let testClient; export function setTestClient(value) { testClient = value }\n${outputText}`
    .replaceAll('import.meta.env', JSON.stringify(env))
    .replace("import('@amplitude/unified')", 'Promise.resolve({ createInstance: () => testClient })')
  const module = await import(`data:text/javascript;base64,${Buffer.from(`${code}\n// ${crypto.randomUUID()}`).toString('base64')}`)
  module.setTestClient(stub)
  return module
}

test('키가 없으면 SDK 초기화와 이벤트 전송을 모두 건너뛴다', async () => {
  let calls = 0
  const client = await clientWithStub({ MODE: 'test' }, {
    init() { calls++; return { promise: Promise.resolve() } },
    track() { calls++; return { promise: Promise.resolve() } },
  })
  client.initializeAnalytics()
  client.trackEvent('Screen Viewed', { screen: 'home' })
  await setImmediate()
  assert.equal(calls, 0)
})

test('초기화 도중 발생한 이벤트는 순서를 유지하고, 재초기화·자동 수집은 하지 않는다', async () => {
  const events = []
  let initialized = 0
  let configuration
  let finish
  const pending = new Promise(resolve => { finish = resolve })
  const client = await clientWithStub({ VITE_AMPLITUDE_API_KEY: 'test-only', VITE_AMPLITUDE_SERVER_ZONE: 'EU', MODE: 'test' }, {
    init(_key, userId, options) {
      assert.equal(userId, undefined)
      initialized++
      configuration = options
      return { promise: pending }
    },
    track(name, properties) { events.push({ name, ...properties }); return { promise: Promise.resolve() } },
  })
  client.initializeAnalytics()
  client.initializeAnalytics()
  client.trackEvent('Screen Viewed', { screen: 'home' })
  client.trackEvent('Correction Step Viewed', { step: 'upload' })
  await setImmediate()
  assert.equal(events.length, 0)
  finish()
  await setImmediate()
  assert.equal(initialized, 1)
  assert.equal(configuration.serverZone, 'EU')
  assert.equal(configuration.autocapture, false)
  assert.equal(configuration.defaultTracking, false)
  assert.equal(configuration.fetchRemoteConfig, false)
  assert.deepEqual(events.map(e => e.name), ['Screen Viewed', 'Correction Step Viewed'])
  assert.ok(events.every(e => e.environment === 'test'))
})

test('분석 SDK 초기화 실패를 앱으로 전파하거나 처리되지 않은 rejection으로 남기지 않는다', async () => {
  const client = await clientWithStub({ VITE_AMPLITUDE_API_KEY: 'test-only', MODE: 'test' }, {
    init() { return { promise: Promise.reject(new Error('SDK unavailable')) } },
    track() { assert.fail('초기화 실패 후 전송하면 안 된다') },
  })
  assert.doesNotThrow(() => client.initializeAnalytics())
  assert.doesNotThrow(() => client.trackEvent('Screen Viewed', { screen: 'home' }))
  await setImmediate()
})

test('실제 Unified SDK에서도 설정 객체가 userId가 아닌 options로 전달된다', async () => {
  const require = createRequire(import.meta.url)
  const { AmplitudeUnified } = require('@amplitude/unified/lib/cjs/unified')
  const sdk = new AmplitudeUnified()
  let captured
  // 설정 인자 해석까지만 실제 SDK를 실행하고, 쿠키 접근·외부 통신 전에는 멈춘다.
  sdk._init = async options => { captured = options }
  const client = await clientWithStub({ VITE_AMPLITUDE_API_KEY: 'test-only', VITE_AMPLITUDE_SERVER_ZONE: 'EU', MODE: 'test' }, sdk)
  client.initializeAnalytics()
  await setImmediate()
  assert.equal(captured.userId, undefined)
  assert.equal(captured.defaultTracking, false)
  assert.equal(captured.autocapture, false)
  assert.equal(captured.serverZone, 'EU')
  assert.equal(captured.fetchRemoteConfig, false)
  assert.equal(captured.trackingOptions.ipAddress, false)
})
