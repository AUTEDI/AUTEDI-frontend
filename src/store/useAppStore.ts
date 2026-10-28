import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import sampleWriting from '../assets/sample-writing.jpeg'
import { initialSettings } from '../features/review/mockData'
import type { FeedbackItem, ReviewSetting, TeacherComment } from '../features/review/types'

export type AppPage = 'home' | 'review'
export type ReviewStep = 'upload' | 'settings' | 'generation' | 'canvas'

type AppState = {
  reviewId: string | null
  startNewReview: () => void
  page: AppPage
  step: ReviewStep
  defaults: ReviewSetting[]
  sessionSettings: ReviewSetting[]
  imageUrl: string | null
  imageName: string | null
  feedback: FeedbackItem[]
  activeFeedbackId: string
  appliedFeedbackIds: string[]
  teacherComments: TeacherComment[]
  sidebarCollapsed: boolean
  toast: string | null
  setPage: (page: AppPage) => void
  setStep: (step: ReviewStep) => void
  setDefaults: (settings: ReviewSetting[]) => void
  setSessionSettings: (settings: ReviewSetting[]) => void
  setImage: (url: string, name: string) => void
  clearImage: () => void
  loadSample: () => void
  setFeedback: (feedback: FeedbackItem[]) => void
  selectFeedback: (id: string) => void
  updateFeedback: (id: string, patch: Partial<FeedbackItem>) => void
  removeFeedback: (id: string) => void
  toggleApplied: (id: string) => void
  addTeacherComment: (comment: TeacherComment) => void
  removeTeacherComment: (id: string) => void
  updateTeacherComment: (id: string, patch: Partial<TeacherComment>) => void
  toggleSidebar: () => void
  showToast: (message: string) => void
  clearToast: () => void
}

function isReviewSetting(value: unknown): value is ReviewSetting {
  if (typeof value !== 'object' || value === null) return false
  const setting = value as Record<string, unknown>
  return (
    typeof setting.id === 'string' &&
    typeof setting.name === 'string' &&
    typeof setting.en === 'string' &&
    typeof setting.icon === 'string' &&
    typeof setting.description === 'string' &&
    typeof setting.selected === 'boolean' &&
    (setting.level === 'Standard' || setting.level === 'Advanced')
  )
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  startNewReview: () => {
    const old = get().imageUrl
    if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
    set({ reviewId: null, page: 'review', step: 'upload', imageUrl: null, imageName: null, feedback: [], activeFeedbackId: '', appliedFeedbackIds: [], teacherComments: [], sessionSettings: get().defaults.map(s => ({ ...s })) })
  },
  reviewId: null,
  page: 'home',
  step: 'upload',
  defaults: initialSettings.map((setting) => ({ ...setting })),
  sessionSettings: initialSettings.map((setting) => ({ ...setting })),
  imageUrl: null,
  imageName: null,
  feedback: [],
  activeFeedbackId: '',
  appliedFeedbackIds: [],
  teacherComments: [],
  sidebarCollapsed: false,
  toast: null,
  setPage: (page) => page === 'review' ? get().startNewReview() : set({ page }),
  setStep: (step) => set({ step }),
  setDefaults: (defaults) => set({ defaults, sessionSettings: defaults.map((setting) => ({ ...setting })) }),
  setSessionSettings: (sessionSettings) => set({ sessionSettings }),
  setImage: (imageUrl, imageName) => set({ reviewId: null, imageUrl, imageName, feedback: [], activeFeedbackId: '', appliedFeedbackIds: [], teacherComments: [] }),
  clearImage: () => set({ reviewId: null, imageUrl: null, imageName: null, feedback: [], teacherComments: [], appliedFeedbackIds: [], activeFeedbackId: '' }),
  loadSample: () => get().setImage(sampleWriting, 'sample-writing.jpeg'),
  setFeedback: (feedback) =>
    set({ feedback, activeFeedbackId: feedback[0]?.id ?? '', appliedFeedbackIds: [] }),
  selectFeedback: (activeFeedbackId) => set({ activeFeedbackId }),
  updateFeedback: (id, patch) =>
    set((state) => ({
      feedback: state.feedback.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),
  removeFeedback: (id) =>
    set((state) => {
      const feedback = state.feedback.filter((item) => item.id !== id)
      return {
        feedback,
        activeFeedbackId:
          state.activeFeedbackId === id ? (feedback[0]?.id ?? '') : state.activeFeedbackId,
        appliedFeedbackIds: state.appliedFeedbackIds.filter((itemId) => itemId !== id),
      }
    }),
  toggleApplied: (id) =>
    set((state) => ({
      appliedFeedbackIds: state.appliedFeedbackIds.includes(id)
        ? state.appliedFeedbackIds.filter((itemId) => itemId !== id)
        : [...state.appliedFeedbackIds, id],
    })),
  addTeacherComment: (comment) =>
    set((state) => ({ teacherComments: [...state.teacherComments, comment] })),
  removeTeacherComment: (id) =>
    set((state) => ({
      teacherComments: state.teacherComments.filter((comment) => comment.id !== id),
    })),
  updateTeacherComment: (id, patch) =>
    set((state) => ({
      teacherComments: state.teacherComments.map((comment) =>
        comment.id === id ? { ...comment, ...patch } : comment,
      ),
    })),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      showToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'autedi-default-settings',
      partialize: (state) => ({ defaults: state.defaults }),
      merge: (persistedState, currentState) => {
        if (typeof persistedState !== 'object' || persistedState === null) return currentState
        if (!('defaults' in persistedState)) return currentState
        const values = persistedState.defaults
        if (!Array.isArray(values) || !values.every(isReviewSetting)) return currentState
        return {
          ...currentState,
          defaults: values,
          sessionSettings: values.map((setting) => ({ ...setting })),
        }
      },
    },
  ),
)
