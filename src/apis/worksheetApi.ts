import { api } from './client'
import type { AreaSetting, CommentDto, CorrectionDto, GenerationDto, HighlightType, RegionDto, ReviewDto, WorksheetDto } from './types'

const worksheet = (worksheetId: number) => `/worksheets/${worksheetId}`

/** API 명세서 v1의 학습지·생성·첨삭·코멘트 엔드포인트 */
export const worksheetApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<WorksheetDto>('/worksheets', form)
  },
  get: (worksheetId: number) => api.get<WorksheetDto>(worksheet(worksheetId)),

  saveSettings: (worksheetId: number, settings: AreaSetting[], ifMatch: string | null) =>
    api.put<{ etag: string; areas: AreaSetting[] }>(`${worksheet(worksheetId)}/settings`, { settings }, { ifMatch }),

  startGeneration: (worksheetId: number, idempotencyKey: string) =>
    api.post<GenerationDto>(`${worksheet(worksheetId)}/generations`, undefined, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
  getGeneration: (worksheetId: number, generationId: number, signal?: AbortSignal) =>
    api.get<GenerationDto>(`${worksheet(worksheetId)}/generations/${generationId}`, { signal }),

  getReview: (worksheetId: number) => api.get<ReviewDto>(`${worksheet(worksheetId)}/review`),

  updateCorrection: (worksheetId: number, correctionId: string, content: string, ifMatch: string | null) =>
    api.patch<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}`, { content }, { ifMatch }),
  deleteCorrection: (worksheetId: number, correctionId: string, ifMatch: string | null) =>
    api.delete<null>(`${worksheet(worksheetId)}/corrections/${correctionId}`, { ifMatch }),
  restoreCorrection: (worksheetId: number, correctionId: string, ifMatch: string | null) =>
    api.post<CorrectionDto>(`${worksheet(worksheetId)}/corrections/${correctionId}/restore`, undefined, { ifMatch }),

  createComment: (
    worksheetId: number,
    body: { pageId: number; regions: RegionDto[]; highlightType: HighlightType; content: string },
  ) => api.post<CommentDto>(`${worksheet(worksheetId)}/comments`, body),
  deleteComment: (worksheetId: number, commentId: string, ifMatch: string | null) =>
    api.delete<null>(`${worksheet(worksheetId)}/comments/${commentId}`, { ifMatch }),
}
