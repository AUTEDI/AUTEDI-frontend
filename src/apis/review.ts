import { apiClient, ApiError, authHeader, request } from './client'

/** 학습지 페이지. width·height는 서버가 방향을 보정한 PNG의 픽셀 크기다. */
export type ReviewPage = { id: number; pageNumber: number; width: number; height: number }

/** 페이지 이미지 전체를 0~1로 본 영역 */
export type Region = { pageId: number; x: number; y: number; width: number; height: number }

export type FeedbackType = 'CORRECTION' | 'SUGGESTION'

export type Correction = {
  id: number
  etag: string | null
  /** GRAMMAR_SPELLING, VOCABULARY_EXPRESSION 등 첨삭 영역 코드 */
  area: string
  feedbackType: FeedbackType
  /** 학생이 쓴 원문 */
  originalText: string
  /** 추천 문장 */
  content: string
  /** 교사용 수정 이유 */
  explanation: string
  regions: Region[]
  isApplied: boolean
  /** 원문을 어떻게 고치는지. 삽입은 ∧, 삭제는 취소선으로 그린다. */
  edit: { operation: 'INSERT' | 'DELETE' | 'REPLACE' | 'RESTRUCTURE'; text: string; position: 'BEFORE' | 'AFTER' | null } | null
  /** 서버가 원문 위치를 확신하지 못한 첨삭 */
  locationUncertain: boolean
}

export type Review = { fileName: string; pages: ReviewPage[]; corrections: Correction[] }

const record = (value: unknown) => (typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {})
const text = (value: unknown) => (typeof value === 'string' ? value : '')
const EDIT_OPERATIONS: readonly string[] = ['INSERT', 'DELETE', 'REPLACE', 'RESTRUCTURE']

function toRegions(value: unknown): Region[] {
  if (!Array.isArray(value)) return []
  return value.map(record).filter((region): region is Region =>
    ['pageId', 'x', 'y', 'width', 'height'].every((key) => typeof region[key] === 'number'),
  )
}

function toCorrection(value: unknown): Correction | null {
  const item = record(value)
  if (typeof item.id !== 'number') return null
  const edit = record(item.edit)
  return {
    id: item.id,
    etag: typeof item.etag === 'string' ? item.etag : null,
    area: text(item.area),
    feedbackType: item.feedbackType === 'SUGGESTION' ? 'SUGGESTION' : 'CORRECTION',
    originalText: text(item.originalText),
    content: text(item.content),
    explanation: text(item.explanation),
    regions: toRegions(item.regions),
    isApplied: item.isApplied === true,
    edit:
      typeof edit.operation === 'string' && EDIT_OPERATIONS.includes(edit.operation)
        ? {
            operation: edit.operation as NonNullable<Correction['edit']>['operation'],
            text: text(edit.text),
            position: edit.position === 'BEFORE' || edit.position === 'AFTER' ? edit.position : null,
          }
        : null,
    locationUncertain: item.locationUncertain === true,
  }
}

/** 검토 화면에 필요한 학습지 정보·페이지·활성 첨삭을 한 번에 받는다. */
export async function getReview(worksheetId: number): Promise<Review> {
  const result = record(
    await request(
      { method: 'get', url: `/api/v1/worksheets/${worksheetId}/review`, headers: authHeader() },
      '첨삭 결과를 불러오지 못했어요. 다시 시도해 주세요.',
    ),
  )
  const worksheet = record(result.worksheet)
  const pages = (Array.isArray(worksheet.pages) ? worksheet.pages : [])
    .map(record)
    .filter((page): page is ReviewPage => ['id', 'pageNumber', 'width', 'height'].every((key) => typeof page[key] === 'number'))
    .sort((a, b) => a.pageNumber - b.pageNumber)
  if (pages.length === 0) throw new ApiError('학습지 페이지를 찾을 수 없어요.')
  const corrections = (Array.isArray(result.corrections) ? result.corrections : [])
    .filter((item) => record(item).status !== 'DELETED')
    .map(toCorrection)
    .filter((item): item is Correction => item !== null)
  return { fileName: text(record(worksheet.file).name), pages, corrections }
}

/** 페이지 이미지를 받아 화면에 걸 수 있는 주소(blob:)로 돌려준다. 다 쓰면 URL.revokeObjectURL로 해제한다. */
export async function getPageImageUrl(worksheetId: number, pageNumber: number): Promise<string> {
  try {
    const { data } = await apiClient.get<Blob>(`/api/v1/worksheets/${worksheetId}/pages/${pageNumber}/image`, {
      headers: authHeader(),
      responseType: 'blob',
    })
    return URL.createObjectURL(data)
  } catch (error) {
    throw new ApiError('학습지 사진을 불러오지 못했어요.', { cause: error })
  }
}

const ifMatch = (correction: Correction) => (correction.etag ? { 'If-Match': correction.etag } : {})

/** 첨삭을 학생 리포트에 반영할지 정한다. 바뀐 첨삭(새 ETag 포함)을 돌려준다. */
export async function setCorrectionApplied(worksheetId: number, correction: Correction, applied: boolean): Promise<Correction> {
  const result = await request(
    {
      method: 'patch',
      url: `/api/v1/worksheets/${worksheetId}/corrections/${correction.id}/apply`,
      params: { applied },
      headers: { ...authHeader(), ...ifMatch(correction) },
    },
    '첨삭을 반영하지 못했어요. 다시 시도해 주세요.',
  )
  // 응답에 첨삭이 없으면 반영 여부만 바꾼다.
  return toCorrection(result) ?? { ...correction, isApplied: applied }
}

/** 첨삭을 지운다. 서버에서는 복원할 수 있는 삭제 상태가 된다. */
export async function deleteCorrection(worksheetId: number, correction: Correction): Promise<void> {
  await request(
    {
      method: 'delete',
      url: `/api/v1/worksheets/${worksheetId}/corrections/${correction.id}`,
      headers: { ...authHeader(), ...ifMatch(correction) },
    },
    '첨삭을 삭제하지 못했어요. 다시 시도해 주세요.',
  )
}
