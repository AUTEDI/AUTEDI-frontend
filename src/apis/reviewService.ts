import { SAMPLE_FILE_NAME, SAMPLE_WORKSHEET_URL, createSampleFeedback } from '../constants/sampleReview'
import type { AiFeedback, FeedbackSetting, ReviewData, TeacherComment } from '../types/review'
import { USE_LIVE_API } from './config'
import { ApiError, isApiError } from './errors'
import { boxToRegion, toAiFeedback, toAreaSettings, toHighlightType, toTeacherComments } from './mappers'
import type { GenerationDto, WorksheetStatus } from './types'
import { worksheetApi } from './worksheetApi'

/** 업로드한 학습지. 예시 모드에서는 서버 ID가 없다. */
export type UploadedWorksheet = {
  worksheetId: number | null
  pageId: number | null
  imageUrl: string
  status: WorksheetStatus | null
  settingsEtag: string | null
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
  updateSuggestion: (worksheetId: number | null, item: AiFeedback, content: string) => Promise<SyncResult>
  deleteFeedback: (worksheetId: number | null, item: AiFeedback) => Promise<SyncResult>
  restoreFeedback: (worksheetId: number | null, item: AiFeedback) => Promise<SyncResult>
  /** 서버가 저장할 수 없는 표시(화살표·네모·삽입)는 serverId가 null로 돌아온다. */
  createComment: (
    worksheetId: number | null,
    pageId: number | null,
    comment: Pick<TeacherComment, 'text' | 'style' | 'box'>,
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
    if (/FAIL|CANCEL/.test(current.status)) {
      throw new ApiError({
        status: 0,
        code: 'UNKNOWN_ERROR',
        message: current.error?.message ?? '첨삭을 생성하지 못했어요. 다시 시도해주세요.',
      })
    }
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

async function loadReview(worksheetId: number): Promise<ReviewData> {
  const { data } = await worksheetApi.getReview(worksheetId)
  // 여러 페이지 화면이 생기기 전까지는 첫 페이지만 보여준다.
  const page = data.worksheet.pages[0]
  return {
    worksheetId,
    pageId: page?.id ?? null,
    imageUrl: page?.imageUrl ?? data.worksheet.file.originalUrl,
    feedback: page ? toAiFeedback(data.corrections, page.id) : [],
    teacherComments: page ? toTeacherComments(data.comments, page.id) : [],
  }
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

async function uploadToServer(file: File): Promise<UploadedWorksheet> {
  const { data } = await worksheetApi.upload(file)
  const page = data.pages[0]
  return {
    worksheetId: data.id,
    pageId: page?.id ?? null,
    imageUrl: page?.imageUrl ?? data.file.originalUrl,
    status: data.status,
    settingsEtag: data.settings.etag,
  }
}

const liveService: ReviewService = {
  uploadWorksheet: uploadToServer,
  uploadSample: async () => {
    const blob = await (await fetch(SAMPLE_WORKSHEET_URL)).blob()
    return uploadToServer(new File([blob], SAMPLE_FILE_NAME, { type: blob.type || 'image/jpeg' }))
  },
  generateReview: async ({ worksheet, settings, signal }) => {
    assertSettings(settings)
    const worksheetId = requireId(worksheet.worksheetId)
    // 첨삭이 끝난(READY) 학습지는 설정을 바꿀 수 없으므로 결과만 다시 연다.
    if (worksheet.status !== 'READY') {
      await worksheetApi.saveSettings(worksheetId, toAreaSettings(settings), worksheet.settingsEtag)
      await startAndWait(worksheetId, signal)
    }
    return loadReview(worksheetId)
  },
  updateSuggestion: async (worksheetId, item, content) => {
    const { data, etag } = await worksheetApi.updateCorrection(requireId(worksheetId), item.id, content, item.etag)
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
    const highlightType = toHighlightType(comment.style)
    if (!highlightType) return { serverId: null, etag: null }
    const page = requireId(pageId)
    const { data, etag } = await worksheetApi.createComment(requireId(worksheetId), {
      pageId: page,
      regions: [boxToRegion(comment.box, page)],
      highlightType,
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

const mockService: ReviewService = {
  // PDF는 페이지 이미지로 바꾸지 않으므로 예시 사진을 보여준다.
  uploadWorksheet: async (file) =>
    mockWorksheet(file.type.startsWith('image/') ? URL.createObjectURL(file) : SAMPLE_WORKSHEET_URL),
  uploadSample: async () => mockWorksheet(SAMPLE_WORKSHEET_URL),
  generateReview: async ({ worksheet, settings, signal }) => {
    assertSettings(settings)
    await wait(SAMPLE_GENERATION_MS, signal)
    return {
      worksheetId: null,
      pageId: null,
      imageUrl: worksheet.imageUrl,
      feedback: createSampleFeedback(),
      teacherComments: [],
    }
  },
  updateSuggestion: async () => ({ etag: null }),
  deleteFeedback: async () => ({ etag: null }),
  restoreFeedback: async () => ({ etag: null }),
  createComment: async () => ({ serverId: null, etag: null }),
  deleteComment: async () => {},
}

export const reviewService: ReviewService = USE_LIVE_API ? liveService : mockService
