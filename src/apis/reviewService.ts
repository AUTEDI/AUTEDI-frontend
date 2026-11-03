import { SAMPLE_FILE_NAME, SAMPLE_WORKSHEET_URL, createSampleFeedback } from '../constants/sampleReview'
import type { AiFeedback, Box, FeedbackSetting, ReviewData, TeacherComment } from '../types/review'
import { USE_LIVE_API } from './config'
import { ApiError, isApiError } from './errors'
import { boxToRegion, toAreaSettings, toCommentColor, toHighlightType, toReviewData } from './mappers'
import type { GenerationDto, WorksheetPageDto, WorksheetStatus } from './types'
import { worksheetApi } from './worksheetApi'

/** 생성 작업이 실패했을 때. 서버가 재시도 가능하다고 하면 retryable이 true다. */
export class GenerationFailedError extends ApiError {
  readonly generationId: number
  readonly retryable: boolean

  constructor(generation: GenerationDto) {
    super({
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: generation.error?.message ?? '첨삭을 생성하지 못했어요. 다시 시도해주세요.',
    })
    this.generationId = generation.id
    this.retryable = generation.error?.retryable ?? false
  }
}

/** 업로드한 학습지. 예시 모드에서는 서버 ID가 없다. */
export type UploadedWorksheet = {
  worksheetId: number | null
  pageId: number | null
  imageUrl: string
  status: WorksheetStatus | null
  settingsEtag: string | null
  /** 업로드 응답에 첨삭 완료 결과가 있으면 추가 요청 없이 사용한다. */
  completedReview?: ReviewData
}

type SyncResult = { etag: string | null }

/** 화면이 쓰는 첨삭 기능. 실제 API와 예시 데이터 구현이 같은 모양이다. */
export type ReviewService = {
  uploadWorksheet: (file: File) => Promise<UploadedWorksheet>
  uploadSample: () => Promise<UploadedWorksheet>
  generateReview: (params: {
    worksheet: UploadedWorksheet
    settings: FeedbackSetting[]
    signal?: AbortSignal
  }) => Promise<ReviewData>
  /** 실패한 생성 작업을 다시 실행하고 결과를 연다. */
  retryReview: (params: { worksheet: UploadedWorksheet; generationId: number; signal?: AbortSignal }) => Promise<ReviewData>
  updateSuggestion: (worksheetId: number | null, item: AiFeedback, content: string) => Promise<SyncResult>
  setApplied: (worksheetId: number | null, item: AiFeedback, applied: boolean) => Promise<SyncResult>
  /** AI 표시를 옮기거나 크기를 바꾼 위치를 저장한다. */
  saveMarkRegion: (worksheetId: number | null, pageId: number | null, item: AiFeedback, mark: Box) => Promise<SyncResult>
  deleteFeedback: (worksheetId: number | null, item: AiFeedback) => Promise<SyncResult>
  restoreFeedback: (worksheetId: number | null, item: AiFeedback) => Promise<SyncResult>
  /** 예시 모드에서는 serverId가 null로 돌아온다. */
  createComment: (
    worksheetId: number | null,
    pageId: number | null,
    comment: Pick<TeacherComment, 'text' | 'style' | 'color' | 'box'>,
  ) => Promise<SyncResult & { serverId: string | null }>
  deleteComment: (worksheetId: number | null, comment: TeacherComment) => Promise<void>
}

const GENERATION_POLL_MS = 1500
const GENERATION_TIMEOUT_MS = 3 * 60 * 1000
const SAMPLE_GENERATION_MS = 2700

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

function assertSettings(settings: FeedbackSetting[]) {
  if (!settings.some((setting) => setting.selected)) throw new ApiError({ status: 400, code: 'GENERATION_004' })
}

function requireId(id: number | null): number {
  if (id === null) throw new ApiError({ status: 400, code: 'WORKSHEET_001' })
  return id
}

// ---------- 실제 API ----------

async function waitForGeneration(worksheetId: number, generation: GenerationDto, signal?: AbortSignal) {
  const startedAt = Date.now()
  let current = generation
  while (current.status !== 'SUCCEEDED') {
    // 서버가 알려준 원인(AI_TIMEOUT 등)의 안내 문구와 재시도 가능 여부를 그대로 전달한다.
    if (current.status === 'FAILED') throw new GenerationFailedError(current)
    if (Date.now() - startedAt > GENERATION_TIMEOUT_MS) {
      throw new ApiError({
        status: 0,
        code: 'UNKNOWN_ERROR',
        message: '첨삭 생성이 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.',
      })
    }
    await wait(GENERATION_POLL_MS, signal)
    current = (await worksheetApi.getGeneration(worksheetId, current.id, signal)).data
  }
}

const pageImages = new Map<string, Promise<string>>()

/**
 * 페이지 이미지 주소. S3 주소는 권한 없이 열리지 않을 수 있어서,
 * 토큰을 붙여 페이지 이미지 API로 받은 뒤 브라우저 주소(blob:)로 바꾼다. 실패하면 응답의 주소를 그대로 쓴다.
 */
function pageImageUrl(worksheetId: number, page: WorksheetPageDto | undefined, fallback: string) {
  if (!page) return Promise.resolve(fallback)
  const key = `${worksheetId}:${page.pageNumber}`
  let url = pageImages.get(key)
  if (!url) {
    url = worksheetApi
      .getPageImage(worksheetId, page.pageNumber)
      .then(({ data }) => URL.createObjectURL(data))
      .catch(() => {
        pageImages.delete(key)
        return fallback
      })
    pageImages.set(key, url)
  }
  return url
}

async function loadReview(worksheetId: number, signal?: AbortSignal): Promise<ReviewData> {
  const { data } = await worksheetApi.getReview(worksheetId, signal)
  const page = data.worksheet.pages[0]
  const { data: corrections } = await worksheetApi.getCorrections(worksheetId, {
    status: 'ACTIVE',
    pageId: page?.id,
  }, signal)
  // 원본·교사 코멘트는 review에서, AI 첨삭은 전용 목록 API에서 가져온다.
  const review = toReviewData({ ...data, corrections })
  return { ...review, imageUrl: await pageImageUrl(worksheetId, page, review.imageUrl) }
}

/** 생성을 시작한다. 이미 진행 중이면 그 작업을 이어서 기다리고, 이미 끝났으면 바로 결과를 연다. */
async function startAndWait(worksheetId: number, signal?: AbortSignal) {
  try {
    const { data } = await worksheetApi.startGeneration(worksheetId, crypto.randomUUID())
    await waitForGeneration(worksheetId, data, signal)
  } catch (error) {
    if (!isApiError(error)) throw error
    if (error.code === 'GENERATION_002') return
    if (error.code !== 'GENERATION_001') throw error
    const { data: worksheet } = await worksheetApi.get(worksheetId)
    if (worksheet.latestGenerationId === null) throw error
    const { data: running } = await worksheetApi.getGeneration(worksheetId, worksheet.latestGenerationId, signal)
    await waitForGeneration(worksheetId, running, signal)
  }
}

/** 실패 후 다시 시작하면 업로드 때 받은 설정 ETag가 이미 바뀌어 있으므로, 412면 최신 ETag로 한 번 더 보낸다. */
async function saveSettings(worksheetId: number, settings: FeedbackSetting[], etag: string | null) {
  try {
    await worksheetApi.saveSettings(worksheetId, toAreaSettings(settings), etag)
  } catch (error) {
    if (!isApiError(error) || error.code !== 'COMMON_412') throw error
    const { data } = await worksheetApi.get(worksheetId)
    await worksheetApi.saveSettings(worksheetId, toAreaSettings(settings), data.settings.etag)
  }
}

async function uploadToServer(file: File): Promise<UploadedWorksheet> {
  const { data } = await worksheetApi.upload(file)
  const worksheet = 'worksheet' in data ? data.worksheet : data
  const page = worksheet.pages[0]
  const imageUrl = await pageImageUrl(worksheet.id, page, page?.imageUrl ?? worksheet.file.originalUrl)
  const completedReview = 'worksheet' in data && worksheet.status === 'READY'
    && (data.generation === null || data.generation.status === 'SUCCEEDED')
    ? { ...toReviewData(data), imageUrl }
    : undefined
  return {
    worksheetId: worksheet.id,
    pageId: page?.id ?? null,
    imageUrl,
    status: worksheet.status,
    settingsEtag: worksheet.settings.etag,
    completedReview,
  }
}

const liveService: ReviewService = {
  uploadWorksheet: uploadToServer,
  uploadSample: async () => {
    const blob = await (await fetch(SAMPLE_WORKSHEET_URL)).blob()
    return uploadToServer(new File([blob], SAMPLE_FILE_NAME, { type: blob.type || 'image/jpeg' }))
  },
  generateReview: async ({ worksheet, settings, signal }) => {
    signal?.throwIfAborted()
    if (worksheet.completedReview) return worksheet.completedReview
    assertSettings(settings)
    const worksheetId = requireId(worksheet.worksheetId)
    // 첨삭이 끝난(READY) 학습지는 결과만 다시 열고, 생성 중(PROCESSING)이면 설정을 바꿀 수 없으므로 기다리기만 한다.
    if (worksheet.status !== 'READY') {
      if (worksheet.status !== 'PROCESSING') await saveSettings(worksheetId, settings, worksheet.settingsEtag)
      await startAndWait(worksheetId, signal)
    }
    return loadReview(worksheetId, signal)
  },
  retryReview: async ({ worksheet, generationId, signal }) => {
    const worksheetId = requireId(worksheet.worksheetId)
    const { data } = await worksheetApi.retryGeneration(worksheetId, generationId, crypto.randomUUID())
    await waitForGeneration(worksheetId, data, signal)
    return loadReview(worksheetId, signal)
  },
  updateSuggestion: async (worksheetId, item, content) => {
    const { data, etag } = await worksheetApi.updateCorrection(requireId(worksheetId), item.id, content, item.etag)
    return { etag: data?.etag ?? etag }
  },
  setApplied: async (worksheetId, item, applied) => {
    const { data, etag } = await worksheetApi.applyCorrection(requireId(worksheetId), item.id, applied, item.etag)
    return { etag: data?.etag ?? etag }
  },
  saveMarkRegion: async (worksheetId, pageId, item, mark) => {
    const { data, etag } = await worksheetApi.updateCorrectionRegions(
      requireId(worksheetId),
      item.id,
      [boxToRegion(mark, pageId)],
      item.etag,
    )
    return { etag: data?.etag ?? etag }
  },
  deleteFeedback: async (worksheetId, item) => {
    const { etag } = await worksheetApi.deleteCorrection(requireId(worksheetId), item.id, item.etag)
    return { etag }
  },
  restoreFeedback: async (worksheetId, item) => {
    const { data, etag } = await worksheetApi.restoreCorrection(requireId(worksheetId), item.id, item.etag)
    return { etag: data?.etag ?? etag }
  },
  createComment: async (worksheetId, pageId, comment) => {
    const page = requireId(pageId)
    const { data, etag } = await worksheetApi.createComment(requireId(worksheetId), {
      pageId: page,
      regions: [boxToRegion(comment.box, page)],
      highlightType: toHighlightType(comment.style),
      color: toCommentColor(comment.color),
      content: comment.text,
    })
    return { serverId: String(data.id), etag: data.etag ?? etag }
  },
  deleteComment: async (worksheetId, comment) => {
    if (comment.serverId === null) return
    await worksheetApi.deleteComment(requireId(worksheetId), comment.serverId, comment.etag)
  },
}

// ---------- 예시 데이터 ----------

const mockWorksheet = (imageUrl: string): UploadedWorksheet => ({
  worksheetId: null,
  pageId: null,
  imageUrl,
  status: null,
  settingsEtag: null,
})

async function sampleReview(worksheet: UploadedWorksheet, signal?: AbortSignal): Promise<ReviewData> {
  await wait(SAMPLE_GENERATION_MS, signal)
  return {
    worksheetId: null,
    pageId: null,
    imageUrl: worksheet.imageUrl,
    feedback: createSampleFeedback(),
    teacherComments: [],
  }
}

const mockService: ReviewService = {
  uploadWorksheet: async (file) => mockWorksheet(URL.createObjectURL(file)),
  uploadSample: async () => mockWorksheet(SAMPLE_WORKSHEET_URL),
  generateReview: async ({ worksheet, settings, signal }) => {
    assertSettings(settings)
    return sampleReview(worksheet, signal)
  },
  retryReview: async ({ worksheet, signal }) => sampleReview(worksheet, signal),
  updateSuggestion: async () => ({ etag: null }),
  setApplied: async () => ({ etag: null }),
  saveMarkRegion: async () => ({ etag: null }),
  deleteFeedback: async () => ({ etag: null }),
  restoreFeedback: async () => ({ etag: null }),
  createComment: async () => ({ serverId: null, etag: null }),
  deleteComment: async () => {},
}

export const reviewService: ReviewService = USE_LIVE_API ? liveService : mockService
