import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createServer } from 'vite'

let server
let store
let app
let service
let originalService

const review = (name) => ({
  worksheetId: name === 'first' ? 1 : 2,
  pageId: name === 'first' ? 10 : 20,
  imageUrl: `/${name}.png`,
  // 예시 모드처럼 서로 다른 파일에 같은 첨삭 ID가 있어도 격리되어야 한다.
  feedback: [{ id: 'shared', suggestion: name, noteText: name, etag: null }],
  teacherComments: [],
})

before(async () => {
  server = await createServer({
    configFile: false,
    envDir: false,
    define: { 'import.meta.env.VITE_API_BASE_URL': '""' },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  store = (await server.ssrLoadModule('/src/stores/useReviewStore.ts')).useReviewStore
  app = (await server.ssrLoadModule('/src/stores/useAppStore.ts')).useAppStore
  service = (await server.ssrLoadModule('/src/apis/reviewService.ts')).reviewService
  originalService = { ...service }
})

beforeEach(() => {
  store.setState(store.getInitialState(), true)
  app.setState(app.getInitialState(), true)
  Object.assign(service, originalService, {
    updateSuggestion: async () => ({ etag: 'updated' }),
    deleteFeedback: async () => ({ etag: 'deleted' }),
    restoreFeedback: async () => ({ etag: 'restored' }),
    createComment: async () => ({ serverId: null, etag: null }),
  })
})

after(async () => {
  if (service) Object.assign(service, originalService)
  await server?.close()
})

test('파일을 전환해도 추천 문장·반영 상태·교사 코멘트·작성 초안이 유지된다', async () => {
  store.getState().startReview('first', review('first'))
  assert.equal(await store.getState().saveSuggestion('shared', 'first edited'), true)
  store.getState().toggleApplied()
  store.getState().setDraft({ left: 10, top: 20, width: 30, height: 5, reverse: false })
  store.getState().finishDraft()
  store.getState().setCommentText('첫 파일 코멘트')
  await store.getState().saveTeacherComment({ left: 200, top: 100, width: 160 })
  store.getState().setCommentText('작성 중인 초안')
  store.getState().zoomBy(0.1)

  store.getState().startReview('second', review('second'))
  assert.equal(store.getState().imageUrl, '/second.png')
  assert.equal(store.getState().teacherComments.length, 0)
  assert.deepEqual(store.getState().appliedIds, [])
  await store.getState().saveSuggestion('shared', 'second edited')

  assert.equal(store.getState().selectReview('first'), true)
  assert.equal(store.getState().imageUrl, '/first.png')
  assert.equal(store.getState().worksheetId, 1)
  assert.equal(store.getState().pageId, 10)
  assert.equal(store.getState().feedback[0].suggestion, 'first edited')
  assert.deepEqual(store.getState().appliedIds, ['shared'])
  assert.equal(store.getState().teacherComments[0].text, '첫 파일 코멘트')
  assert.equal(store.getState().commentText, '작성 중인 초안')
  assert.equal(store.getState().zoom, 0.9)
  assert.equal(store.getState().selectReview('second'), true)
  assert.equal(store.getState().feedback[0].suggestion, 'second edited')
})

test('없는 파일 선택은 현재 검토를 변경하지 않는다', () => {
  store.getState().startReview('first', review('first'))
  assert.equal(store.getState().selectReview('missing'), false)
  assert.equal(store.getState().activeUploadId, 'first')
  assert.equal(store.getState().selectReview('first'), true)
})

test('서버의 반영 상태로 시작하고 파일 전환 후에도 상태를 유지한다', () => {
  store.getState().startReview('first', { ...review('first'), appliedIds: ['shared', 'missing'] })
  assert.deepEqual(store.getState().appliedIds, ['shared'])
  store.getState().toggleApplied()
  store.getState().startReview('second', review('second'))
  assert.deepEqual(store.getState().appliedIds, [])
  store.getState().selectReview('first')
  assert.deepEqual(store.getState().appliedIds, [])
})

test('저장 완료 전 파일 전환을 막고 결과를 원래 파일에 반영한다', async () => {
  store.getState().startReview('first', review('first'))
  store.getState().startReview('second', review('second'))
  store.getState().selectReview('first')
  let finish
  service.updateSuggestion = () => new Promise((resolve) => { finish = resolve })
  const saving = store.getState().saveSuggestion('shared', 'saved first')
  assert.equal(store.getState().pendingMutations, 1)
  assert.equal(store.getState().selectReview('second'), false)
  store.getState().startReview('third', review('third'))
  assert.equal(store.getState().activeUploadId, 'first')
  finish({ etag: 'saved' })
  await saving
  assert.equal(store.getState().pendingMutations, 0)
  assert.equal(store.getState().selectReview('second'), true)
  assert.equal(store.getState().feedback[0].suggestion, 'second')
  store.getState().selectReview('first')
  assert.equal(store.getState().feedback[0].suggestion, 'saved first')
})

test('여러 저장 요청이 모두 끝나야 파일 전환을 허용한다', async () => {
  store.getState().startReview('first', review('first'))
  store.getState().startReview('second', review('second'))
  store.getState().selectReview('first')
  const completions = []
  service.updateSuggestion = () => new Promise((resolve) => { completions.push(resolve) })
  const one = store.getState().saveSuggestion('shared', 'one')
  const two = store.getState().saveSuggestion('shared', 'two')
  assert.equal(store.getState().pendingMutations, 2)
  completions[0]({ etag: 'one' })
  await one
  assert.equal(store.getState().pendingMutations, 1)
  assert.equal(store.getState().selectReview('second'), false)
  completions[1]({ etag: 'two' })
  await two
  assert.equal(store.getState().selectReview('second'), true)
})

test('저장이 실패해도 전환 잠금을 해제하고 기존 내용을 유지한다', async () => {
  store.getState().startReview('first', review('first'))
  service.updateSuggestion = async () => { throw new Error('network failure') }
  assert.equal(await store.getState().saveSuggestion('shared', 'failed'), false)
  assert.equal(store.getState().pendingMutations, 0)
  assert.equal(store.getState().feedback[0].suggestion, 'first')
})

test('삭제 상태를 파일별로 복원하고 다른 파일에서 이전 되돌리기를 실행하지 않는다', async () => {
  store.getState().startReview('first', review('first'))
  await store.getState().dismissActiveFeedback()
  const undo = app.getState().toast.action.onClick
  store.getState().startReview('second', review('second'))
  await store.getState().dismissActiveFeedback()
  undo()
  assert.deepEqual(store.getState().dismissedIds, ['shared'])
  store.getState().selectReview('first')
  assert.equal(app.getState().toast, null)
  assert.deepEqual(store.getState().dismissedIds, ['shared'])
  await store.getState().restoreFeedback('shared')
  assert.deepEqual(store.getState().dismissedIds, [])
  store.getState().selectReview('second')
  assert.deepEqual(store.getState().dismissedIds, ['shared'])
})
