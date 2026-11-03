import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let fitImageSize
let pointInRect

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
