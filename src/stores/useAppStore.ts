import { create } from 'zustand'
import { ApiError, getErrorMessage } from '../apis/errors'
import { reviewService, type UploadedWorksheet } from '../apis/reviewService'
import { SAMPLE_FILE_NAME } from '../constants/sampleReview'
import { BASE_SETTINGS, DEFAULT_SETTINGS_STORAGE_KEY, cloneSettings } from '../constants/settings'
import type { FeedbackSetting, FlowStep } from '../types/review'

export type Page = 'home' | 'ai'

export type UploadedFile = {
  id: string
  name: string
  meta: string
  worksheet: UploadedWorksheet
}

export type ToastAction = { label: string; onClick: () => void }

type Toast = { id: number; message: string; action?: ToastAction }

type AppState = {
  page: Page
  step: FlowStep
  sidebarCollapsed: boolean
  toast: Toast | null
  defaults: FeedbackSetting[]
  sessionSettings: FeedbackSetting[]
  uploads: UploadedFile[]
  activeUploadId: string | null
  uploading: boolean
  navigate: (page: Page) => void
  setStep: (step: FlowStep) => void
  toggleSidebar: () => void
  showToast: (message: string, action?: ToastAction) => void
  hideToast: () => void
  saveDefaults: (settings: FeedbackSetting[]) => boolean
  resetSessionSettings: () => void
  updateSessionSetting: (setting: FeedbackSetting) => void
  loadFiles: (files: File[]) => Promise<void>
  loadSample: () => Promise<void>
  selectUpload: (id: string) => void
  removeFile: (id: string) => void
  /** 첨삭이 끝난 학습지는 다시 생성하지 않고 결과만 연다. */
  markWorksheetReady: (id: string) => void
}

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function isFeedbackSetting(value: unknown): value is FeedbackSetting {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (
    BASE_SETTINGS.some((setting) => setting.id === item.id) &&
    typeof item.selected === 'boolean' &&
    (item.level === 'Standard' || item.level === 'Advanced')
  )
}

/** 저장된 기본 설정을 읽는다. 형식이 맞지 않으면 기본값을 쓴다. */
function readStoredDefaults() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEFAULT_SETTINGS_STORAGE_KEY) ?? 'null')
    if (Array.isArray(parsed) && parsed.length === BASE_SETTINGS.length && parsed.every(isFeedbackSetting)) {
      // 문구는 코드 기준으로 유지하고 선택 여부와 수준만 저장값을 쓴다.
      return BASE_SETTINGS.map((base) => {
        const stored = parsed.find((item) => item.id === base.id)
        return { ...base, selected: stored?.selected ?? base.selected, level: stored?.level ?? base.level }
      })
    }
  } catch {
    // 저장 공간을 읽을 수 없으면 기본값을 쓴다.
  }
  return cloneSettings(BASE_SETTINGS)
}

const initialDefaults = readStoredDefaults()

export const useAppStore = create<AppState>()((set, get) => {
  /** 파일별 요청을 순서대로 보내고 성공한 파일은 유지한다. */
  const upload = async (requests: { request: () => Promise<UploadedWorksheet>; name: string; meta: string }[]) => {
    if (!requests.length) return
    if (get().uploading) return
    set({ uploading: true })
    let succeeded = 0
    const failures: string[] = []
    try {
      for (const { request, name, meta } of requests) {
        try {
          const worksheet = await request()
          const file = { id: crypto.randomUUID(), name, meta, worksheet }
          succeeded += 1
          set((state) => ({
            uploads: [...state.uploads, file],
            activeUploadId: succeeded === 1 ? file.id : state.activeUploadId,
          }))
        } catch (error) {
          failures.push(`${name}: ${getErrorMessage(error, '학습지를 올리지 못했어요. 잠시 후 다시 시도해주세요.')}`)
        }
      }
      get().showToast(
        failures.length
          ? `${succeeded}개 업로드 완료 · ${failures.length}개 실패. ${failures[0]}`
          : `학습지 ${succeeded}개를 불러왔어요`,
      )
    } finally {
      set({ uploading: false })
    }
  }

  return {
    page: 'home',
    step: 'upload',
    sidebarCollapsed: false,
    toast: null,
    defaults: initialDefaults,
    sessionSettings: cloneSettings(initialDefaults),
    uploads: [],
    activeUploadId: null,
    uploading: false,

    navigate: (page) => {
      set(page === 'ai' ? { page, step: 'upload' } : { page })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    setStep: (step) => set({ step }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    showToast: (message, action) => set({ toast: { id: Date.now(), message, action } }),
    hideToast: () => set({ toast: null }),

    saveDefaults: (settings) => {
      if (!settings.some((setting) => setting.selected)) {
        get().showToast('첨삭 영역을 한 가지 이상 선택해주세요')
        return false
      }
      try {
        localStorage.setItem(DEFAULT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
      } catch {
        // 저장 공간을 쓸 수 없어도 이번 접속 동안은 적용한다.
      }
      set({ defaults: cloneSettings(settings), sessionSettings: cloneSettings(settings) })
      get().showToast('기본 첨삭 설정을 저장했어요')
      return true
    },
    resetSessionSettings: () => set({ sessionSettings: cloneSettings(get().defaults) }),
    updateSessionSetting: (next) =>
      set((state) => ({
        sessionSettings: state.sessionSettings.map((setting) => (setting.id === next.id ? next : setting)),
      })),

    loadFiles: (files) => upload(files.map((file) => ({
      request: async () => {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) throw new ApiError({ status: 400, code: 'FILE_002' })
        if (file.size === 0) throw new ApiError({ status: 400, code: 'FILE_001' })
        return reviewService.uploadWorksheet(file)
      },
      name: file.name,
      meta: `${(file.size / 1024 / 1024).toFixed(1)} MB · 준비 완료`,
    }))),
    loadSample: () => upload([{
      request: () => reviewService.uploadSample(),
      name: SAMPLE_FILE_NAME,
      meta: '예시 사진 · 준비 완료',
    }]),
    selectUpload: (id) => {
      if (get().uploads.some((file) => file.id === id)) set({ activeUploadId: id })
    },
    removeFile: (id) => {
      if (get().uploading) return
      set((state) => {
        const index = state.uploads.findIndex((file) => file.id === id)
        const uploads = state.uploads.filter((file) => file.id !== id)
        return {
          uploads,
          activeUploadId: state.activeUploadId === id
            ? (uploads[Math.min(index, uploads.length - 1)]?.id ?? null)
            : state.activeUploadId,
        }
      })
    },
    markWorksheetReady: (id) => set((state) => ({
      uploads: state.uploads.map((file) => file.id === id
        ? { ...file, worksheet: { ...file.worksheet, status: 'READY' } }
        : file),
    })),
  }
})
