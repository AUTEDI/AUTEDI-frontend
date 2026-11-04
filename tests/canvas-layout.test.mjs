import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let fitImageSize
let pointInRect
let clampAiNotePosition
let placeAiNote

before(async () => {
  server = await createServer({
    configFile: false,
    envDir: false,
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  const geometry = await server.ssrLoadModule('/src/utils/annotation.ts')
  fitImageSize = geometry.fitImageSize
  pointInRect = geometry.pointInRect
  clampAiNotePosition = geometry.clampAiNotePosition
  placeAiNote = geometry.placeAiNote
})

after(async () => { await server?.close() })

const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`)

for (const [name, image] of [
  ['세로', { width: 3024, height: 4032 }],
  ['가로', { width: 4032, height: 3024 }],
  ['정사각형', { width: 2000, height: 2000 }],
  ['매우 긴 세로', { width: 600, height: 6000 }],
  ['매우 긴 가로', { width: 6000, height: 600 }],
]) {
  test(`${name} 이미지는 원본 비율을 유지하고 표시 영역을 벗어나지 않는다`, () => {
    for (const bounds of [{ width: 620, height: 600 }, { width: 200, height: 640 }]) {
      const size = fitImageSize(image, bounds)
      closeTo(size.width / size.height, image.width / image.height)
      assert.ok(size.width <= bounds.width + 1e-8)
      assert.ok(size.height <= bounds.height + 1e-8)
      assert.ok(Math.abs(size.width - bounds.width) < 1e-8 || Math.abs(size.height - bounds.height) < 1e-8)
      // 이미지와 첨삭이 같은 영역을 쓰므로 줌 후에도 좌표가 왕복 변환된다.
      for (const zoom of [0.6, 0.8, 1.2]) {
        const rect = { left: 100, top: 80, width: size.width * zoom, height: size.height * zoom }
        const point = pointInRect(rect.left + rect.width * 0.2, rect.top + rect.height * 0.3, rect)
        closeTo(point.x, 20)
        closeTo(point.y, 30)
      }
    }
  })
}

test('브라우저 크기가 바뀌어도 같은 비율로 다시 맞춘다', () => {
  const image = { width: 4032, height: 3024 }
  const large = fitImageSize(image, { width: 800, height: 600 })
  const small = fitImageSize(image, { width: 320, height: 600 })
  assert.ok(small.width < large.width)
  closeTo(small.width / small.height, large.width / large.height)
})

test('아직 로드되지 않았거나 유효하지 않은 크기로는 표시 영역을 만들지 않는다', () => {
  for (const dimension of [0, -1, NaN, Infinity]) {
    assert.equal(fitImageSize({ width: dimension, height: 100 }, { width: 600, height: 600 }), null)
    assert.equal(fitImageSize({ width: 100, height: dimension }, { width: 600, height: 600 }), null)
    assert.equal(fitImageSize({ width: 100, height: 100 }, { width: dimension, height: 600 }), null)
    assert.equal(fitImageSize({ width: 100, height: 100 }, { width: 600, height: dimension }), null)
  }
})

test('AI 문장은 이미지에서 16px 떨어져 배치되고 양쪽 끝은 이미지 밖 200px 이내다', () => {
  const board = { x: 0, y: 0, width: 1200, height: 800 }
  const photo = { x: 400, y: 100, width: 400, height: 600 }
  const note = { width: 136, height: 60 }
  assert.deepEqual(placeAiNote(photo, board, note, 'right', 30), { x: 816, y: 280 })
  assert.deepEqual(placeAiNote(photo, board, note, 'left', 30), { x: 248, y: 280 })
  assert.deepEqual(clampAiNotePosition({ x: -1000, y: -1000 }, photo, board, note), { x: 200, y: 8 })
  assert.deepEqual(clampAiNotePosition({ x: 2000, y: 2000 }, photo, board, note), { x: 864, y: 732 })
})

test('기본 배치 방향에 공간이 없으면 반대쪽 여백을 사용한다', () => {
  const board = { x: 0, y: 0, width: 700, height: 800 }
  const photo = { x: 400, y: 100, width: 250, height: 600 }
  assert.deepEqual(placeAiNote(photo, board, { width: 136, height: 60 }, 'right', 30), { x: 248, y: 280 })
})

test('좁은 캔버스에서는 문장 전체를 보이게 배치하고 이동을 제한한다', () => {
  const board = { x: 0, y: 0, width: 280, height: 690 }
  const photo = { x: 64, y: 100, width: 152, height: 480 }
  const note = { width: 62.4, height: 60 }
  for (const position of [
    placeAiNote(photo, board, note, 'right', 90),
    clampAiNotePosition({ x: -200, y: -200 }, photo, board, note),
    clampAiNotePosition({ x: 1000, y: 1000 }, photo, board, note),
  ]) {
    assert.ok(position.x >= 8 && position.x + note.width <= board.width - 8 + 1e-8)
    assert.ok(position.y >= 8 && position.y + note.height <= board.height - 8)
  }
})

test('확대율과 이미지 비율이 달라도 화면에서의 간격과 이동 한계는 유지된다', () => {
  const board = { x: 100, y: 80, width: 1800, height: 1000 }
  for (const zoom of [0.6, 0.8, 1.2]) {
    for (const width of [200, 600]) {
      const photo = { x: 800, y: 180, width: width * zoom, height: 500 * zoom }
      const note = { width: 136 * zoom, height: 60 * zoom }
      const initial = placeAiNote(photo, board, note, 'right', 30)
      closeTo(initial.x - photo.x - photo.width, 16)
      const left = clampAiNotePosition({ x: -1000, y: 180 }, photo, board, note)
      const right = clampAiNotePosition({ x: 3000, y: 180 }, photo, board, note)
      closeTo(photo.x - left.x, 200)
      closeTo(right.x + note.width - photo.x - photo.width, 200)
      const percent = (right.x - photo.x) / photo.width * 100
      closeTo(photo.x + percent / 100 * photo.width, right.x)
    }
  }
})
