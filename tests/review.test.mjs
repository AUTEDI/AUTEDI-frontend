import ts from 'typescript'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import { test } from 'node:test'
const js = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
const mockUrl = url(js(fs.readFileSync('src/features/review/mockData.ts', 'utf8')))
const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
globalThis.window = { setTimeout: callback => { callback(); return 0 }, localStorage: storage }
globalThis.localStorage = storage
const { initialSettings } = await import(mockUrl)
const { generateReview } = await import(url(js(fs.readFileSync('src/services/reviewService.ts', 'utf8')).replace("'../features/review/mockData'", JSON.stringify(mockUrl))))
test('each selected category produces only its feedback and each intensity changes the suggestion', async () => {
  for (const setting of initialSettings) {
    const standard = initialSettings.map(s => ({ ...s, selected: s.id === setting.id, level: 'Standard' }))
    const advanced = standard.map(s => ({ ...s, level: 'Advanced' }))
    const first = (await generateReview(standard)).feedback
    assert.equal(first.length, 1)
    assert.equal(first[0].category, setting.en)
    assert.notEqual(first[0].suggestion, (await generateReview(advanced)).feedback[0].suggestion)
  }
})
test('custom images do not receive sample feedback; empty settings are rejected', async () => {
  assert.deepEqual((await generateReview(initialSettings, false)).feedback, [])
  await assert.rejects(generateReview(initialSettings.map(s => ({ ...s, selected: false }))))
})
const code = js(fs.readFileSync('src/store/useAppStore.ts', 'utf8'))
  .replace("'zustand'", JSON.stringify(import.meta.resolve('zustand')))
  .replace("'zustand/middleware'", JSON.stringify(import.meta.resolve('zustand/middleware')))
  .replace("'../assets/sample-writing.jpeg'", JSON.stringify(url('export default "sample.jpeg"')))
  .replace("'../features/review/mockData'", JSON.stringify(mockUrl))
const { useAppStore: store } = await import(url(code))
test('new review clears previous student data and restores defaults', () => {
  store.setState({ teacherComments: [{ id: 'old' }], feedback: [{ id: 'old' }], appliedFeedbackIds: ['old'], imageUrl: 'old', sessionSettings: [] })
  store.getState().startNewReview()
  assert.equal(store.getState().imageUrl, null)
  assert.deepEqual(store.getState().teacherComments, [])
  assert.deepEqual(store.getState().feedback, [])
  assert.deepEqual(store.getState().appliedFeedbackIds, [])
  assert.deepEqual(store.getState().sessionSettings, store.getState().defaults)
})
test('image replacement clears annotations and saved review identity', () => {
  store.setState({ teacherComments: [{ id: 'old' }], feedback: [{ id: 'old' }], reviewId: 'old' })
  store.getState().setImage('new', 'new.png')
  assert.deepEqual(store.getState().teacherComments, [])
  assert.deepEqual(store.getState().feedback, [])
  assert.equal(store.getState().reviewId, null)
})
