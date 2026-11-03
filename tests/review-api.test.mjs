import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createServer } from 'vite'
import { response } from './fixtures/review-response.mjs'
import { correctionListResponse } from './fixtures/correction-list-response.mjs'

let server
let service
let mappers
let worksheetApi
let calls
let uploadResponse
let correctionResponse
const originalFetch = globalThis.fetch
const settings = [{ id: 'grammar', selected: true, level: 'Standard' }]
const envelope = (result) => ({ isSuccess: true, code: 'COMMON_200', result })
const file = () => new File(['image'], 'student-writing.jpeg', { type: 'image/jpeg' })

before(async () => {
  server = await createServer({
    configFile: false,
    envDir: false,
    define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example.test"' },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  service = (await server.ssrLoadModule('/src/apis/reviewService.ts')).reviewService
  mappers = await server.ssrLoadModule('/src/apis/mappers.ts')
  worksheetApi = (await server.ssrLoadModule('/src/apis/worksheetApi.ts')).worksheetApi
})

beforeEach(() => {
  calls = []
  uploadResponse = structuredClone(response)
  correctionResponse = envelope({ items: structuredClone(response.result.corrections), total: 3 })
  // 실제 API 클라이언트를 사용하고 통신만 테스트 응답으로 대체한다.
  globalThis.fetch = async (url, init) => {
    init.signal?.throwIfAborted()
    const parsed = new URL(url)
    const path = parsed.pathname
    calls.push({ path, query: parsed.searchParams, ...init })
    let body
    if (path === '/api/v1/worksheets' && init.method === 'POST') body = uploadResponse
    else if (path.endsWith('/review') && init.method === 'GET') body = response
    else if (path.endsWith('/corrections') && init.method === 'GET') body = correctionResponse
    else if (path.endsWith('/settings') && init.method === 'PUT') body = envelope({ etag: '"settings_16-v4"', areas: [] })
    else if (path.endsWith('/generations') && init.method === 'POST') body = envelope(response.result.generation)
    else throw new Error(`Unexpected request: ${init.method} ${path}`)
    return Response.json(body)
  }
})

after(async () => {
  globalThis.fetch = originalFetch
  await server?.close()
})

test('완료 결과가 포함된 업로드 응답을 변환하고 추가 API 요청 없이 사용한다', async () => {
  const uploaded = await service.uploadWorksheet(file())
  assert.equal(uploaded.worksheetId, 16)
  assert.equal(uploaded.pageId, 16)
  assert.equal(uploaded.settingsEtag, '"settings_16-v3"')
  assert.equal(uploaded.imageUrl, response.result.worksheet.pages[0].imageUrl)
  assert.equal(uploaded.completedReview.feedback.length, 3)
  assert.deepEqual(uploaded.completedReview.feedback[0].mark, { left: 20, top: 30, width: 15, height: 4 })
  assert.deepEqual(uploaded.completedReview.feedback.map((item) => item.kind), ['correction', 'improvement', 'correction'])
  assert.deepEqual(uploaded.completedReview.appliedIds, ['7', '8', '9'])
  assert.equal(uploaded.completedReview.feedback[0].etag, '"cor_7-v1"')
  assert.equal(await service.generateReview({ worksheet: uploaded, settings }), uploaded.completedReview)
  assert.equal(calls.length, 1)
  assert.ok(calls[0].body instanceof FormData)
  assert.equal(calls[0].body.get('file').name, 'student-writing.jpeg')
  assert.equal(calls[0].headers.has('Content-Type'), false)
})

test('기존 학습지 단독 응답은 설정 저장·분석·결과 조회 흐름을 유지한다', async () => {
  uploadResponse = envelope({ ...structuredClone(response.result.worksheet), status: 'DRAFT', latestGenerationId: null })
  const uploaded = await service.uploadWorksheet(file())
  assert.equal(uploaded.completedReview, undefined)
  const result = await service.generateReview({ worksheet: uploaded, settings })
  assert.equal(result.feedback.length, 3)
  assert.deepEqual(calls.map(({ method, path }) => `${method} ${path}`), [
    'POST /api/v1/worksheets',
    'PUT /api/v1/worksheets/16/settings',
    'POST /api/v1/worksheets/16/generations',
    'GET /api/v1/worksheets/16/review',
    'GET /api/v1/worksheets/16/corrections',
  ])
  assert.equal(calls[1].headers.get('If-Match'), '"settings_16-v3"')
  assert.ok(calls[2].headers.get('Idempotency-Key'))
  assert.deepEqual(result.appliedIds, ['7', '8', '9'])
  assert.equal(calls[4].query.get('status'), 'ACTIVE')
  assert.equal(calls[4].query.get('pageId'), '16')
})

test('READY 학습지는 결과만 조회하고 중복 분석하지 않는다', async () => {
  uploadResponse = envelope(response.result.worksheet)
  const uploaded = await service.uploadWorksheet(file())
  const result = await service.generateReview({ worksheet: uploaded, settings })
  assert.equal(result.feedback.length, 3)
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'GET', 'GET'])
})

test('corrections 목록의 결과를 화면에 사용하고 review의 목록으로 덮어쓰지 않는다', async () => {
  uploadResponse = envelope(response.result.worksheet)
  const item = { ...structuredClone(response.result.corrections[1]), content: '목록 API에서 받은 문장', isApplied: false }
  correctionResponse = envelope({ corrections: [item] })
  const uploaded = await service.uploadWorksheet(file())
  const result = await service.generateReview({ worksheet: uploaded, settings })
  assert.deepEqual(result.feedback.map((feedback) => feedback.suggestion), ['목록 API에서 받은 문장'])
  assert.deepEqual(result.appliedIds, [])
  assert.equal(result.imageUrl, response.result.worksheet.pages[0].imageUrl)
})

test('실제 items·total 응답의 문장·좌표·반영 상태를 변환하고 전체 건수를 보존한다', async () => {
  correctionResponse = structuredClone(correctionListResponse)
  const result = await worksheetApi.getCorrections(16, { status: 'ACTIVE', pageId: 10 })
  assert.equal(result.total, 5)
  assert.equal(result.data.length, 1)
  assert.equal(result.data[0].source, 'FIXED')
  const data = structuredClone(response.result)
  data.worksheet.pages[0].id = 10
  const review = mappers.toReviewData({ ...data, corrections: result.data })
  assert.equal(review.feedback[0].id, '201')
  assert.equal(review.feedback[0].suggestion, 'He goes to school every day.')
  assert.equal(review.feedback[0].etag, '"cor_201-v1"')
  assert.deepEqual(review.feedback[0].mark, { left: 12, top: 34, width: 25, height: 4.5 })
  assert.deepEqual(review.appliedIds, ['201'])
})

test('빈 items 응답도 정상 목록으로 처리한다', async () => {
  uploadResponse = envelope(response.result.worksheet)
  correctionResponse = envelope({ items: [], total: 0 })
  const uploaded = await service.uploadWorksheet(file())
  const result = await service.generateReview({ worksheet: uploaded, settings })
  assert.deepEqual(result.feedback, [])
  assert.deepEqual(result.appliedIds, [])
})

test('기존 배열 응답도 유지하고 total이 없으면 배열 길이를 사용한다', async () => {
  correctionResponse = envelope(response.result.corrections)
  const result = await worksheetApi.getCorrections(16)
  assert.equal(result.total, 3)
  assert.equal(result.data.length, 3)
})

test('items가 배열이 아닌 응답은 형식 오류로 처리한다', async () => {
  correctionResponse = envelope({ items: null, total: 0 })
  await assert.rejects(worksheetApi.getCorrections(16), /첨삭 목록 응답 형식/)
})

test('목록 API의 빈 배열은 빈 목록으로 표시한다', async () => {
  uploadResponse = envelope(response.result.worksheet)
  correctionResponse = envelope([])
  const uploaded = await service.uploadWorksheet(file())
  const result = await service.generateReview({ worksheet: uploaded, settings })
  assert.deepEqual(result.feedback, [])
  assert.deepEqual(result.appliedIds, [])
})

test('명세의 모든 필터와 isApplied=false를 GET 쿼리로 전달한다', async () => {
  await worksheetApi.getCorrections(16, {
    status: 'DELETED', pageId: 16, area: 'GRAMMAR_MECHANICS', feedbackType: 'CORRECTION', isApplied: false,
  })
  assert.equal(calls[0].method, 'GET')
  assert.equal(calls[0].path, '/api/v1/worksheets/16/corrections')
  assert.deepEqual(Object.fromEntries(calls[0].query), {
    status: 'DELETED', pageId: '16', area: 'GRAMMAR_MECHANICS', feedbackType: 'CORRECTION', isApplied: 'false',
  })
  assert.equal(calls[0].body, undefined)
})

test('선택하지 않은 필터를 생략하고 isApplied=true도 전달한다', async () => {
  await worksheetApi.getCorrections(16)
  assert.equal(calls[0].query.size, 0)
  await worksheetApi.getCorrections(16, { pageId: undefined, isApplied: true })
  assert.deepEqual(Object.fromEntries(calls[1].query), { isApplied: 'true' })
})

test('잘못된 목록 응답을 빈 목록으로 숨기지 않는다', async () => {
  correctionResponse = envelope({ unexpected: [] })
  await assert.rejects(worksheetApi.getCorrections(16), /첨삭 목록 응답 형식/)
})

test('목록 요청에 전달한 취소 신호를 유지한다', async () => {
  const controller = new AbortController()
  await worksheetApi.getCorrections(16, {}, controller.signal)
  assert.equal(calls[0].signal, controller.signal)
  await assert.rejects(worksheetApi.getCorrections(16, {}, AbortSignal.abort()), { name: 'AbortError' })
})

test('GRAMMAR_MECHANICS도 문법 첨삭 영역으로 변환한다', () => {
  const data = structuredClone(response.result)
  data.corrections[0].area = 'GRAMMAR_MECHANICS'
  const result = mappers.toReviewData(data)
  assert.equal(result.feedback[0].category, mappers.toReviewData(response.result).feedback[0].category)
  assert.equal(result.feedback[0].kind, 'correction')
})

test('완료되지 않은 업로드 결과를 완료 캐시로 취급하지 않는다', async () => {
  uploadResponse.result.worksheet.status = 'PROCESSING'
  uploadResponse.result.generation.status = 'RUNNING'
  const uploaded = await service.uploadWorksheet(file())
  assert.equal(uploaded.completedReview, undefined)
})

test('다중 페이지에서 페이지가 불명확한 첨삭은 목록에만 남기고 다른 페이지 좌표는 제외한다', () => {
  const data = structuredClone(response.result)
  data.worksheet.pages.push({ ...data.worksheet.pages[0], id: 17, pageNumber: 2 })
  data.corrections[1].regions[0].pageId = 16
  data.corrections[2].regions[0].pageId = 17
  const result = mappers.toReviewData(data)
  assert.deepEqual(result.feedback.map((item) => item.id), ['7', '8'])
  assert.equal(result.feedback[0].mark, null)
  assert.deepEqual(result.feedback[1].mark, { left: 25, top: 45, width: 20, height: 4 })
})

test('기존 pageId 좌표와 단위 생략을 지원하고 알 수 없는 단위는 그리지 않는다', () => {
  const data = structuredClone(response.result)
  data.corrections[0].regions[0].pageId = 16
  delete data.corrections[0].regionCoordinateUnit
  data.corrections[1].regionCoordinateUnit = 'UNSUPPORTED'
  const result = mappers.toReviewData(data)
  assert.deepEqual(result.feedback[0].mark, { left: 20, top: 30, width: 15, height: 4 })
  assert.equal(result.feedback[1].mark, null)
})

test('삭제된 첨삭을 제외하고 서버의 반영 상태를 초기화한다', () => {
  const data = structuredClone(response.result)
  data.corrections[0].status = 'DELETED'
  data.corrections[1].isApplied = false
  const result = mappers.toReviewData(data)
  assert.deepEqual(result.feedback.map((item) => item.id), ['8', '9'])
  assert.deepEqual(result.appliedIds, ['9'])
  delete data.corrections[2].isApplied
  assert.deepEqual(mappers.toReviewData(data).appliedIds, [])
})

test('페이지 이미지가 없으면 원본 URL을 사용하고 위치 없는 첨삭을 목록에 표시한다', () => {
  const data = structuredClone(response.result)
  delete data.worksheet.pages[0].imageUrl
  assert.equal(mappers.toReviewData(data).imageUrl, data.worksheet.file.originalUrl)
  data.worksheet.pages = []
  const result = mappers.toReviewData(data)
  assert.equal(result.pageId, null)
  assert.equal(result.feedback.length, 3)
  assert.ok(result.feedback.every((item) => item.mark === null))
})

test('교사 코멘트는 코멘트의 pageId를 사용해 페이지 정보 없는 영역을 변환한다', () => {
  const comments = [{ id: 1, pageId: 16, content: '코멘트', highlightType: 'UNDERLINE', regions: [{ x: 0.2, y: 0.3, width: 0.15, height: 0.04 }], etag: '"comment_1-v1"' }]
  const result = mappers.toTeacherComments(comments, 16)
  assert.equal(result.length, 1)
  assert.equal(result[0].style, 'underline')
  assert.deepEqual(result[0].box, { left: 20, top: 30, width: 15, height: 4, reverse: false })
  assert.deepEqual(mappers.toTeacherComments(comments, 17), [])
})

test('취소된 요청은 완료 결과가 있어도 열지 않는다', async () => {
  const uploaded = await service.uploadWorksheet(file())
  await assert.rejects(service.generateReview({ worksheet: uploaded, settings, signal: AbortSignal.abort() }), { name: 'AbortError' })
  assert.equal(calls.length, 1)
})
