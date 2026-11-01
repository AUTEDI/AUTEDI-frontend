import { create } from 'zustand'
import { API_ERROR_MESSAGES, getErrorMessage } from '../apis/errors'
import { reviewService, type UploadedWorksheet } from '../apis/reviewService'
import { SAMPLE_FILE_NAME } from '../constants/sampleReview'
import { BASE_SETTINGS, DEFAULT_SETTINGS_STORAGE_KEY, cloneSettings } from '../constants/settings'
import type { FeedbackSetting, FlowStep } from '../types/review'

export type Page = 'home' | 'ai'

export type UploadedFile = {
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
  upload: UploadedFile | null
  uploading: boolean
  navigate: (page: Page) => void
  setStep: (step: FlowStep) => void
  toggleSidebar: () => void
  showToast: (message: string, action?: ToastAction) => void
  hideToast: () => void
  saveDefaults: (settings: FeedbackSetting[]) => boolean
  resetSessionSettings: () => void
  updateSessionSetting: (setting: FeedbackSetting) => void
  loadFile: (file: File) => Promise<void>
  loadSample: () => Promise<void>
  removeFile: () => void
  /** 첨삭이 끝난 학습지는 다시 생성하지 않고 결과만 연다. */
  markWorksheetReady: () => void
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
  /** 업로드 요청을 보내고 결과를 반영한다. 업로드 중에는 다른 업로드를 받지 않는다. */
  const upload = async (request: () => Promise<UploadedWorksheet>, name: string, meta: string) => {
    if (get().uploading) return
    set({ uploading: true })
    try {
      const worksheet = await request()
      set({ upload: { name, meta, worksheet } })
      get().showToast('학습지 사진을 안전하게 불러왔어요')
    } catch (error) {
      get().showToast(getErrorMessage(error, '학습지를 올리지 못했어요. 잠시 후 다시 시도해주세요.'))
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
    upload: null,
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

    loadFile: async (file) => {
      // 서버와 같은 기준으로 먼저 확인해 불필요한 업로드를 줄인다.
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        get().showToast(API_ERROR_MESSAGES.FILE_002)
        return
      }
      if (file.size === 0) {
        get().showToast(API_ERROR_MESSAGES.FILE_001)
        return
      }
      await upload(
        () => reviewService.uploadWorksheet(file),
        file.name,
        `${(file.size / 1024 / 1024).toFixed(1)} MB · 준비 완료`,
      )
    },
    loadSample: () => upload(() => reviewService.uploadSample(), SAMPLE_FILE_NAME, '예시 사진 · 준비 완료'),
    removeFile: () => set({ upload: null }),
    markWorksheetReady: () =>
      set((state) =>
        state.upload ? { upload: { ...state.upload, worksheet: { ...state.upload.worksheet, status: 'READY' } } } : {},
      ),
  }
})
