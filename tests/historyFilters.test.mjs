import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function loadTypeScript(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const { filterCorrectionHistory, DEFAULT_HISTORY_FILTERS } = await loadTypeScript('../src/pages/history/historyFilters.ts')
const { mockCorrections } = await loadTypeScript('../src/mocks/corrections.ts')

test('기본은 모든 이력을 최신순으로 보여준다', () => {
  const result = filterCorrectionHistory(mockCorrections, DEFAULT_HISTORY_FILTERS)
  assert.equal(result.length, 13)
  assert.equal(result[0].id, 'correction-13')
  assert.equal(result.at(-1).id, 'correction-1')
})

test('제목은 대소문자와 앞뒤 공백을 무시하고 부분 검색한다', () => {
  const result = filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, query: '  FAVORITE  ' })
  assert.deepEqual(result.map(item => item.id), ['correction-13', 'correction-8'])
})

test('학생과 담당 선생님 이름으로도 검색한다', () => {
  const result = filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, query: '박지현' })
  assert.equal(result.length, 5)
  assert.ok(result.every(item => item.teacher.name === '박지현'))
  assert.equal(filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, query: '김민서' }).length, 3)
})

test('검색과 상태·학생·담당 선생님 조건을 동시에 적용한다', () => {
  const result = filterCorrectionHistory(mockCorrections, {
    ...DEFAULT_HISTORY_FILTERS, query: 'frances', status: 'completed', studentId: 'student-1', teacherId: 'teacher-1',
  })
  assert.deepEqual(result.map(item => item.id), ['correction-3'])
})

test('서로 맞지 않는 조건이나 없는 검색어는 빈 목록이다', () => {
  assert.equal(filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, query: '없는 첨삭 제목' }).length, 0)
  assert.equal(filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, studentId: 'student-1', teacherId: 'teacher-2' }).length, 0)
})

test('작성일 정렬은 필터 결과에 적용하고 원본 목록은 바꾸지 않는다', () => {
  const original = mockCorrections.map(item => item.id)
  const result = filterCorrectionHistory(mockCorrections, { ...DEFAULT_HISTORY_FILTERS, status: 'draft', sort: 'oldest' })
  assert.deepEqual(result.map(item => item.id), ['correction-2', 'correction-5', 'correction-8', 'correction-11', 'correction-13'])
  assert.deepEqual(mockCorrections.map(item => item.id), original)
})
