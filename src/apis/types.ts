/** 백엔드 API 명세서 v1의 요청·응답 타입 */

/** 학습지·첨삭 API의 공통 응답 포장 */
export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  error: unknown
}

export type AreaCode = 'GRAMMAR_SPELLING' | 'VOCABULARY_EXPRESSION' | 'SENTENCE_STRUCTURE' | 'CONTENT_SUMMARY'
export type LevelCode = 'STANDARD' | 'ADVANCED'

export type AreaSetting = { area: AreaCode; level: LevelCode }

export type WorksheetStatus = 'DRAFT' | 'READY' | 'FAILED' | (string & {})

/** 페이지 이미지 기준 0~1 좌표 */
export type RegionDto = {
  pageId: number
  x: number
  y: number
  width: number
  height: number
  polygon: unknown
}

export type WorksheetPageDto = {
  id: number
  pageNumber: number
  width: number
  height: number
  imageUrl: string
  urlExpiresAt: string | null
}

export type WorksheetDto = {
  id: number
  etag: string
  status: WorksheetStatus
  file: {
    name: string
    mediaType: string
    sizeBytes: number
    originalUrl: string
    urlExpiresAt: string | null
  }
  pages: WorksheetPageDto[]
  settings: { etag: string; areas: AreaSetting[] }
  latestGenerationId: number | null
  createdAt: string
  updatedAt: string
}

export type GenerationStatus = 'SUCCEEDED' | 'FAILED' | (string & {})

export type GenerationDto = {
  id: number
  worksheetId: number
  status: GenerationStatus
  stage: string
  attempt: number
  retryOfGenerationId: number | null
  settingsSnapshot: AreaSetting[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  error: { code?: string; message?: string; retryable?: boolean } | null
}

export type CorrectionStatus = 'ACTIVE' | 'DELETED'

export type CorrectionDto = {
  id: number
  etag: string
  generationId: number
  source: 'AI' | (string & {})
  area: AreaCode
  originalText: string
  aiInitialContent: string
  content: string
  explanation: string
  regions: RegionDto[]
  editedByTeacher: boolean
  explanationStale: boolean
  status: CorrectionStatus
  createdAt: string
  updatedAt: string
  /** AI 공통 응답 계약 v1에서 추가 예정. 오면 오류 수정/개선 제안 구분에 쓴다. */
  feedbackType?: 'CORRECTION' | 'SUGGESTION' | null
}

export type HighlightType = 'HIGHLIGHT' | 'UNDERLINE'

export type CommentDto = {
  id: number
  etag: string
  source: 'TEACHER' | (string & {})
  pageId: number
  highlightType: HighlightType
  regions: RegionDto[]
  content: string
  createdAt: string
  updatedAt: string
}

export type ReviewDto = {
  worksheet: WorksheetDto
  generation: GenerationDto | null
  corrections: CorrectionDto[]
  comments: CommentDto[]
}

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'

export type AuthUserDto = {
  userId: number
  email: string
  name: string
  role: 'DIRECTOR' | 'TEACHER'
  academyId: number
  academyName: string
  subscriptionStatus: SubscriptionStatus
  planExpiresAt?: string | null
  lastLoginAt?: string
}

export type TokenPair = { accessToken: string; refreshToken: string }

export type LoginResponse = TokenPair & { user: AuthUserDto }
