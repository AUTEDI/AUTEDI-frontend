import { api } from './client'
import { ApiError } from './errors'
import type { AreaSetting, CommentColor, CommentDto, CorrectionDto, CorrectionFilters, CorrectionListDto, GenerationDto, HighlightType, RegionDto, ReviewDto, WorksheetDto, WorksheetUploadDto } from './types'

const worksheet = (worksheetId: number) => `/worksheets/${worksheetId}`

/** API 명세서 v1의 학습지·생성·첨삭·코멘트 엔드포인트 */
export const worksheetApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<WorksheetUploadDto>('/worksheets', form)
  },
  get: (worksheetId: number) => api.get<WorksheetDto>(worksheet(worksheetId)),

  // 노션 예시는 settings 키로 바뀌어 있지만 실제 서버는 areas 키를 검증한다.
  saveSettings: (worksheetId: number, areas: AreaSetting[], ifMatch: string | null) =>
    api.put<{ etag: string; areas: AreaSetting[] }>(`${worksheet(worksheetId)}/settings`, { areas }, { ifMatch }),

  startGeneration: (worksheetId: number, idempotencyKey: string) =>
    api.post<GenerationDto>(`${worksheet(worksheetId)}/generations`, undefined, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  getGeneration: (worksheetId: number, generationId: number, signal?: AbortSignal) =>
    api.get<GenerationDto>(`${worksheet(worksheetId)}/generations/${generationId}`, { signal }),

  getReview: (worksheetId: number, signal?: AbortSignal) => api.get<ReviewDto>(`${worksheet(worksheetId)}/review`, { signal }),

  getCorrections: async (worksheetId: number, filters: CorrectionFilters = {}, signal?: AbortSignal) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      // false도 유효한 필터 값이므로 undefined만 제외한다.
      if (value !== undefined) query.set(key, String(value))
    }
    const suffix = query.size ? `?${query.toString()}` : ''
    const response = await api.get<CorrectionListDto>(`${worksheet(worksheetId)}/corrections${suffix}`, { signal })
    const payload = response.data
    const corrections = Array.isArray(payload)
      ? payload
      : payload && 'items' in payload ? payload.items : payload?.corrections
    if (!Array.isArray(corrections)) {
      throw new ApiError({ status: response.status, code: 'UNKNOWN_ERROR', message: '첨삭 목록 응답 형식을 확인해주세요.' })
    }
    const total = !Array.isArray(payload) && payload && 'total' in payload
      ? payload.total
      : corrections.length
    return { ...response, data: corrections, total }
  },

  /** 회전 보정된 페이지 PNG. 토큰이 필요해 <img src>로 바로 쓸 수 없다. */
  getPageImage: (worksheetId: number, pageNumber: number, signal?: AbortSignal) =>
    api.blob(`${worksheet(worksheetId)}/pages/${pageNumber}/image`, { signal }),

  retryGeneration: (worksheetId: number, generationId: number, idempotencyKey: string) =>
    api.post<GenerationDto>(`${worksheet(worksheetId)}/generations/${generationId}/retry`, undefined, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  updateCorrection: (worksheetId: number, correctionId: string, content: string, ifMatch: string | null) =>
    api.patch<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}`, { content }, { ifMatch }),
  /** 같은 수정 API로 표시 위치·크기만 바꾼다(부분 수정). */
  updateCorrectionRegions: (worksheetId: number, correctionId: string, regions: RegionDto[], ifMatch: string | null) =>
    api.patch<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}`, { regions }, { ifMatch }),
  applyCorrection: (worksheetId: number, correctionId: string, applied: boolean, ifMatch: string | null) =>
    api.patch<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}/apply?applied=${applied}`, undefined, {
      ifMatch,
    }),
  deleteCorrection: (worksheetId: number, correctionId: string, ifMatch: string | null) =>
    api.delete<null>(`${worksheet(worksheetId)}/corrections/${correctionId}`, { ifMatch }),
  restoreCorrection: (worksheetId: number, correctionId: string, ifMatch: string | null) =>
    api.post<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}/restore`, undefined, { ifMatch }),

  createComment: (
    worksheetId: number,
    body: { pageId: number; regions: RegionDto[]; highlightType: HighlightType; color: CommentColor; content: string },
  ) => api.post<CommentDto>(`${worksheet(worksheetId)}/comments`, body),
  deleteComment: (worksheetId: number, commentId: string, ifMatch: string | null) =>
    api.delete<null>(`${worksheet(worksheetId)}/comments/${commentId}`, { ifMatch }),
}
