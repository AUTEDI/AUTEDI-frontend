import { apiClient, ApiError, authHeader, request } from './client'

export type CorrectionArea = 'GRAMMAR_SPELLING' | 'VOCABULARY_EXPRESSION' | 'SENTENCE_STRUCTURE' | 'CONTENT_SUMMARY'
export type CorrectionLevel = 'STANDARD' | 'ADVANCED'

// 기본 JSON 헤더를 덮어써야 axios가 FormData를 JSON으로 바꾸지 않고 boundary를 붙여 보낸다.
const multipartHeaders = () => ({ ...authHeader(), 'Content-Type': 'multipart/form-data' })
// 큰 사진 여러 장이나 휴대폰 회선에서도 올릴 시간을 넉넉히 준다.
const UPLOAD_TIMEOUT_MS = 60000

/** 올린 비율(0~1)을 알려주는 콜백. 전체 크기를 모르면 부르지 않는다. */
type OnProgress = (ratio: number) => void

const progressHandler = (onProgress?: OnProgress) =>
  onProgress && (({ loaded, total }: { loaded: number; total?: number }) => {
    if (total) onProgress(loaded / total)
  })

/** 사진들을 올려 새 학습지를 만들고 ID를 돌려준다. 올린 순서대로 페이지가 된다. */
export async function createWorksheet(files: File[], signal?: AbortSignal, onProgress?: OnProgress): Promise<number> {
  const form = new FormData()
  files.forEach((file) => form.append('file', file))
  const result = await request(
    {
      method: 'post',
      url: '/api/v1/worksheets',
      data: form,
      headers: multipartHeaders(),
      timeout: UPLOAD_TIMEOUT_MS,
      signal,
      onUploadProgress: progressHandler(onProgress),
    },
    '학습지를 올리지 못했어요. 다시 시도해 주세요.',
  )
  const id = (result as Record<string, unknown> | null)?.id
  if (typeof id !== 'number') throw new ApiError('올린 학습지를 확인할 수 없어요. 다시 시도해 주세요.')
  return id
}

/** DRAFT·FAILED 상태 학습지의 원본 사진을 바꾼다. (설정은 그대로 남는다) */
export async function replaceWorksheetFile(worksheetId: number, file: File, onProgress?: OnProgress): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await request(
    {
      method: 'put',
      url: `/api/v1/worksheets/${worksheetId}/file`,
      data: form,
      headers: multipartHeaders(),
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: progressHandler(onProgress),
    },
    '사진을 올리지 못했어요. 다시 시도해 주세요.',
  )
}

/** 학습지 원본 사진을 파일로 받는다. 인증 헤더가 필요해 <img src>로 바로 걸 수 없다. */
export async function getWorksheetFile(worksheetId: number): Promise<File> {
  try {
    const { data } = await apiClient.get<Blob>(`/api/v1/worksheets/${worksheetId}/file`, {
      headers: authHeader(),
      responseType: 'blob',
      timeout: UPLOAD_TIMEOUT_MS,
    })
    return new File([data], `worksheet-${worksheetId}.${data.type === 'image/png' ? 'png' : 'jpg'}`, { type: data.type })
  } catch (error) {
    throw new ApiError('학습지 사진을 불러오지 못했어요.', { cause: error })
  }
}

/** 첨삭 영역과 수준을 저장한다. 기존 설정을 전체 교체한다. */
export async function saveWorksheetSettings(
  worksheetId: number,
  areas: { area: CorrectionArea; level: CorrectionLevel }[],
  signal?: AbortSignal,
): Promise<void> {
  await request(
    { method: 'put', url: `/api/v1/worksheets/${worksheetId}/settings`, data: { areas }, headers: authHeader(), signal },
    '첨삭 영역을 저장하지 못했어요. 다시 시도해 주세요.',
  )
}
