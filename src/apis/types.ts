/** 백엔드 API 명세서 v1의 요청·응답 타입 */

/** 학습지·첨삭 API의 공통 응답 포장 */
export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  error: unknown
}

export type AreaCode = 'GRAMMAR_SPELLING' | 'GRAMMAR_MECHANICS' | 'VOCABULARY_EXPRESSION' | 'SENTENCE_STRUCTURE' | 'CONTENT_SUMMARY'
export type LevelCode = 'STANDARD' | 'ADVANCED'

export type AreaSetting = { area: AreaCode; level: LevelCode }

/** 학습지 상태: 업로드 직후 DRAFT, 생성 중 PROCESSING, 완료 READY, 실패 FAILED */
export type WorksheetStatus = 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED'

/** 페이지 이미지 기준 0~1 좌표 */
export type RegionDto = {
  /** 단일 페이지 응답에서는 생략될 수 있다. */
  pageId?: number | null
  x: number
  y: number
  width: number
  height: number
  polygon?: unknown
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

/** 생성 작업 상태. PENDING·RUNNING이면 계속 조회하고, SUCCEEDED·FAILED면 멈춘다. */
export type GenerationStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'

/** 생성 세부 단계 */
export type GenerationStage = 'QUEUED' | 'OCR' | 'AI_CORRECTION' | 'COMPLETED'

export type GenerationDto = {
  id: number
  worksheetId: number
  status: GenerationStatus
  stage: GenerationStage
  attempt: number
  retryOfGenerationId: number | null
  settingsSnapshot: AreaSetting[]
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  /** 실패 시 원인. code 예: AI_TIMEOUT, AI_MODEL_ERROR, OCR_FAILED */
  error: { code: string; message: string; retryable: boolean } | null
}

export type CorrectionStatus = 'ACTIVE' | 'DELETED'
export type CorrectionFeedbackType = 'CORRECTION' | 'SUGGESTION'

/** GET /worksheets/{worksheetId}/corrections의 선택적 쿼리 파라미터 */
export type CorrectionFilters = {
  status?: CorrectionStatus
  pageId?: number
  area?: AreaCode
  feedbackType?: CorrectionFeedbackType
  isApplied?: boolean
}

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
  /** 없으면 기존 영역 기준으로 오류 수정/개선 제안을 구분한다. */
  feedbackType?: CorrectionFeedbackType | null
  isApplied?: boolean | null
  regionCoordinateUnit?: 'NORMALIZED_0_1' | (string & {}) | null
  requiresReview?: boolean | null
  locationUncertain?: boolean | null
  // null로만 확인된 확장 필드는 계약이 정해질 때 구체화한다.
  action?: unknown
  anchor?: unknown
  issueKinds?: unknown
  warnings?: unknown
}

export type CorrectionListDto =
  | { items: CorrectionDto[]; total: number }
  | CorrectionDto[]
  | { corrections: CorrectionDto[] }

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
  aiResults?: unknown[]
  reviewIssues?: unknown[]
  summary?: unknown[]
}

/** 업로드는 학습지 정보만 반환하거나, 완료된 첨삭 결과까지 함께 반환할 수 있다. */
export type WorksheetUploadDto = WorksheetDto | ReviewDto

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
