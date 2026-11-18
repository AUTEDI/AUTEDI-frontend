/** 학습지의 파일 제목과 학생. 서버에 필드가 없어 브라우저(localStorage)에만 둔다. */
export type WorksheetMeta = { title: string; studentName: string }

// shortcut: 학습지 API에 제목·학생 필드가 없어 사용성 테스트용으로 이 브라우저에만 저장한다, 백엔드 필드가 생기면 업로드 요청에 함께 보낸다.
const KEY = 'autedi.worksheetMeta'

function readAll(): Record<string, WorksheetMeta> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return typeof value === 'object' && value !== null ? (value as Record<string, WorksheetMeta>) : {}
  } catch {
    return {}
  }
}

export function saveWorksheetMeta(worksheetId: number, meta: WorksheetMeta) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [worksheetId]: meta }))
  } catch {
    // 저장할 수 없어도 첨삭은 계속한다. 검토 화면에서는 파일 이름으로 대신 보여준다.
  }
}

/** 저장된 제목·학생. 없거나 형식이 깨졌으면 빈 값이다. */
export function loadWorksheetMeta(worksheetId: number): WorksheetMeta {
  const meta = readAll()[worksheetId]
  return {
    title: typeof meta?.title === 'string' ? meta.title : '',
    studentName: typeof meta?.studentName === 'string' ? meta.studentName : '',
  }
}
