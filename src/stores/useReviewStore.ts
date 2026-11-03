import { create } from 'zustand'
import { getErrorMessage } from '../apis/errors'
import { reviewService } from '../apis/reviewService'
import { SAMPLE_WORKSHEET_URL, createSampleFeedback } from '../constants/sampleReview'
import type {
  AiFeedback,
  AnnotationColor,
  AnnotationStyle,
  Box,
  PanelMode,
  ReviewData,
  SelectionBox,
  TeacherComment,
  ToolMode,
} from '../types/review'
import { clamp } from '../utils/annotation'
import { useAppStore, type ToastAction } from './useAppStore'

export const MIN_ZOOM = 0.6
export const MAX_ZOOM = 1.2

type ReviewState = {
  activeUploadId: string | null
  reviewsByUploadId: Record<string, ReviewDocumentState>
  pendingMutations: number
  worksheetId: number | null
  pageId: number | null
  imageUrl: string
  feedback: AiFeedback[]
  activeFeedbackId: string
  appliedIds: string[]
  dismissedIds: string[]

  panelOpen: boolean
  panelMode: PanelMode
  /** AI 목록 아래에 상세 설명을 펼쳤는지 */
  detailOpen: boolean

  toolMode: ToolMode
  guideHidden: boolean
  annotationStyle: AnnotationStyle
  annotationColor: AnnotationColor
  /** 지금 그리고 있는 교사 표시 영역 */
  draft: SelectionBox | null
  draftReady: boolean
  commentText: string
  savingComment: boolean
  teacherComments: TeacherComment[]
  selectedTeacherId: string | null
  zoom: number

  startReview: (uploadId: string, data: ReviewData) => void
  selectReview: (uploadId: string) => boolean
  selectFeedback: (id: string) => void
  showAiList: () => void
  showManualEditor: () => void
  closePanel: () => void
  toggleApplied: () => Promise<void>
  dismissActiveFeedback: () => Promise<void>
  restoreFeedback: (id: string) => Promise<void>
  /** 저장에 성공하면 true를 돌려준다. */
  saveSuggestion: (id: string, suggestion: string) => Promise<boolean>
  moveAiMark: (id: string, mark: Box) => void
  /** 옮기거나 크기를 바꾼 AI 표시 위치를 저장한다. */
  saveAiMark: (id: string, message: string) => Promise<void>
  moveAiNote: (id: string, position: { left: number; top: number }) => void

  setToolMode: (mode: ToolMode) => void
  hideGuide: () => void
  beginAnnotation: (style: AnnotationStyle) => void
  setAnnotationColor: (color: AnnotationColor) => void
  startNewTeacherComment: () => void
  cancelTeacherComment: () => void
  setDraft: (draft: SelectionBox) => void
  finishDraft: () => void
  setCommentText: (text: string) => void
  saveTeacherComment: (note: NonNullable<TeacherComment['note']>) => Promise<void>
  focusTeacherComment: (id: string) => void
  deleteTeacherComment: (id: string) => Promise<void>
  moveTeacherMark: (id: string, box: Box) => void
  moveTeacherNote: (id: string, position: { left: number; top: number }) => void
  /** 서버에서 불러와 아직 위치가 없는 교사 코멘트를 배치한다. */
  placeTeacherNotes: (notes: Record<string, NonNullable<TeacherComment['note']>>) => void

  zoomBy: (delta: number) => void
}

const toast = (message: string, action?: ToastAction) => useAppStore.getState().showToast(message, action)

function firstRemainingId(feedback: AiFeedback[], dismissedIds: string[]) {
  return feedback.find((item) => !dismissedIds.includes(item.id))?.id ?? null
}

const emptyEditor = { draft: null, draftReady: false, commentText: '' }

const DOCUMENT_KEYS = [
  'worksheetId', 'pageId', 'imageUrl', 'feedback', 'activeFeedbackId', 'appliedIds', 'dismissedIds',
  'panelOpen', 'panelMode', 'detailOpen', 'toolMode', 'guideHidden', 'annotationStyle', 'annotationColor',
  'draft', 'draftReady', 'commentText', 'savingComment', 'teacherComments', 'selectedTeacherId', 'zoom',
] as const

type ReviewDocumentState = Pick<ReviewState, typeof DOCUMENT_KEYS[number]>

function snapshotReview(state: ReviewState): ReviewDocumentState {
  return Object.fromEntries(DOCUMENT_KEYS.map((key) => [key, state[key]])) as ReviewDocumentState
}

/** 예시 모드에서 저장한 교사 표시의 화면용 ID */
let localCommentSeq = 0

export const useReviewStore = create<ReviewState>()((set, get) => {
  // 저장 요청이 끝나기 전에 파일을 바꾸면 다른 파일에 결과가 적용될 수 있으므로 전환을 잠근다.
  const mutate = async <T,>(action: () => Promise<T>): Promise<T> => {
    set((state) => ({ pendingMutations: state.pendingMutations + 1 }))
    try {
      return await action()
    } finally {
      set((state) => ({ pendingMutations: state.pendingMutations - 1 }))
    }
  }

  const patchFeedback = (id: string, patch: Partial<AiFeedback>) =>
    set((state) => ({ feedback: state.feedback.map((item) => (item.id === id ? { ...item, ...patch } : item)) }))

  const findFeedback = (id: string) => get().feedback.find((item) => item.id === id)

  // 같은 첨삭의 수정은 앞 요청이 돌려준 ETag가 필요하므로 차례대로 보낸다.
  const feedbackQueues = new Map<string, Promise<unknown>>()
  const queueFeedback = <T,>(id: string, action: () => Promise<T>): Promise<T> => {
    const result = (feedbackQueues.get(id) ?? Promise.resolve()).then(action)
    const settled = result.catch(() => {})
    feedbackQueues.set(id, settled)
    void settled.then(() => {
      if (feedbackQueues.get(id) === settled) feedbackQueues.delete(id)
    })
    return mutate(() => result)
  }

  return {
    activeUploadId: null,
    reviewsByUploadId: {},
    pendingMutations: 0,
    worksheetId: null,
    pageId: null,
    imageUrl: SAMPLE_WORKSHEET_URL,
    feedback: createSampleFeedback(),
    activeFeedbackId: '1',
    appliedIds: [],
    dismissedIds: [],
    panelOpen: true,
    panelMode: 'ai',
    detailOpen: false,
    toolMode: 'idle',
    guideHidden: false,
    annotationStyle: 'underline',
    annotationColor: 'blue',
    ...emptyEditor,
    savingComment: false,
    teacherComments: [],
    selectedTeacherId: null,
    zoom: 0.8,

    startReview: (uploadId, data) => {
      const current = get()
      if (current.pendingMutations) return
      const document: ReviewDocumentState = {
        ...data,
        activeFeedbackId: data.feedback[0]?.id ?? '',
        appliedIds: data.appliedIds?.filter((id) => data.feedback.some((item) => item.id === id)) ?? [],
        dismissedIds: [],
        panelOpen: true,
        panelMode: 'ai',
        detailOpen: false,
        toolMode: 'idle',
        guideHidden: false,
        ...emptyEditor,
        savingComment: false,
        selectedTeacherId: null,
        annotationStyle: 'underline',
        annotationColor: 'blue',
        zoom: 0.8,
      }
      set({
        ...document,
        activeUploadId: uploadId,
        reviewsByUploadId: {
          ...current.reviewsByUploadId,
          ...(current.activeUploadId ? { [current.activeUploadId]: snapshotReview(current) } : {}),
          [uploadId]: document,
        },
      })
      useAppStore.getState().hideToast()
    },
    selectReview: (uploadId) => {
      const current = get()
      if (current.pendingMutations) return false
      if (current.activeUploadId === uploadId) return true
      const document = current.reviewsByUploadId[uploadId]
      if (!document) return false
      set({
        ...document,
        activeUploadId: uploadId,
        reviewsByUploadId: {
          ...current.reviewsByUploadId,
          ...(current.activeUploadId ? { [current.activeUploadId]: snapshotReview(current) } : {}),
        },
      })
      useAppStore.getState().hideToast()
      return true
    },

    selectFeedback: (id) => {
      if (get().dismissedIds.includes(id)) return
      if (get().toolMode === 'annotate') get().setToolMode('idle')
      set({ activeFeedbackId: id, panelOpen: true, panelMode: 'ai', detailOpen: true })
    },
    showAiList: () => set({ panelOpen: true, panelMode: 'ai', detailOpen: false }),
    showManualEditor: () => set({ panelOpen: true, panelMode: 'teacher' }),
    closePanel: () => set({ panelOpen: false }),

    toggleApplied: () => {
      const id = get().activeFeedbackId
      return queueFeedback(id, async () => {
        const item = findFeedback(id)
        if (!item) return
        const applied = !get().appliedIds.includes(id)
        try {
          const { etag } = await reviewService.setApplied(get().worksheetId, item, applied)
          patchFeedback(id, { etag })
        } catch (error) {
          toast(getErrorMessage(error, '반영 여부를 저장하지 못했어요. 다시 시도해주세요.'))
          return
        }
        set((state) => ({
          appliedIds: applied ? [...state.appliedIds, id] : state.appliedIds.filter((appliedId) => appliedId !== id),
        }))
        toast(applied ? '이 첨삭을 반영했어요' : '첨삭 반영을 취소했어요')
      })
    },
    dismissActiveFeedback: () => mutate(async () => {
      const uploadId = get().activeUploadId
      const item = findFeedback(get().activeFeedbackId)
      if (!item) return
      try {
        const { etag } = await reviewService.deleteFeedback(get().worksheetId, item)
        patchFeedback(item.id, { etag })
      } catch (error) {
        toast(getErrorMessage(error, 'AI 첨삭을 삭제하지 못했어요. 다시 시도해주세요.'))
        return
      }
      const dismissedIds = [...get().dismissedIds, item.id]
      set({ dismissedIds })
      const next = firstRemainingId(get().feedback, dismissedIds)
      if (next) get().selectFeedback(next)
      else get().showAiList()
      toast('선택한 AI 첨삭을 삭제했어요', {
        label: '되돌리기',
        onClick: () => { if (get().activeUploadId === uploadId) void get().restoreFeedback(item.id) },
      })
    }),
    restoreFeedback: (id) => mutate(async () => {
      const item = findFeedback(id)
      if (!item || !get().dismissedIds.includes(id)) return
      try {
        const { etag } = await reviewService.restoreFeedback(get().worksheetId, item)
        patchFeedback(id, { etag })
      } catch (error) {
        toast(getErrorMessage(error, '삭제를 되돌리지 못했어요. 다시 시도해주세요.'))
        return
      }
      set((state) => ({ dismissedIds: state.dismissedIds.filter((dismissed) => dismissed !== id) }))
      get().selectFeedback(id)
      toast('삭제한 AI 첨삭을 되돌렸어요')
    }),
    saveSuggestion: (id, suggestion) => mutate(async () => {
      const item = findFeedback(id)
      if (!item) return false
      try {
        const { etag } = await reviewService.updateSuggestion(get().worksheetId, item, suggestion)
        patchFeedback(id, { suggestion, noteText: suggestion, etag })
        toast('추천 문장을 수정했어요')
        return true
      } catch (error) {
        toast(getErrorMessage(error, '추천 문장을 저장하지 못했어요. 다시 시도해주세요.'))
        return false
      }
    }),
    moveAiMark: (id, mark) => patchFeedback(id, { mark }),
    saveAiMark: (id, message) => queueFeedback(id, async () => {
      const item = findFeedback(id)
      if (!item?.mark) return
      try {
        const { etag } = await reviewService.saveMarkRegion(get().worksheetId, get().pageId, item, item.mark)
        patchFeedback(id, { etag })
        toast(message)
      } catch (error) {
        toast(getErrorMessage(error, 'AI 표시 위치를 저장하지 못했어요. 다시 시도해주세요.'))
      }
    }),
    moveAiNote: (id, notePosition) => patchFeedback(id, { notePosition }),

    setToolMode: (toolMode) => set({ toolMode, guideHidden: false }),
    hideGuide: () => set({ guideHidden: true }),
    beginAnnotation: (annotationStyle) => {
      set({ annotationStyle })
      get().setToolMode('annotate')
      get().showManualEditor()
    },
    setAnnotationColor: (annotationColor) => set({ annotationColor }),
    startNewTeacherComment: () => {
      get().showManualEditor()
      set({ toolMode: 'annotate', guideHidden: false, ...emptyEditor })
    },
    cancelTeacherComment: () => {
      set({ ...emptyEditor, toolMode: 'idle', guideHidden: true })
      get().showAiList()
      toast('수기 첨삭 입력을 취소했어요')
    },
    setDraft: (draft) => set({ draft }),
    finishDraft: () => set((state) => ({ draftReady: (state.draft?.width ?? 0) > 2 })),
    setCommentText: (commentText) => set({ commentText }),
    saveTeacherComment: (note) => mutate(async () => {
      const { draft, draftReady, commentText, annotationStyle, annotationColor, savingComment } = get()
      const text = commentText.trim()
      if (!draft || !draftReady || !text || savingComment) return
      set({ savingComment: true })
      try {
        const { serverId, etag } = await reviewService.createComment(get().worksheetId, get().pageId, {
          text,
          style: annotationStyle,
          color: annotationColor,
          box: draft,
        })
        const comment: TeacherComment = {
          id: serverId ? `server-${serverId}` : `local-${++localCommentSeq}`,
          text,
          style: annotationStyle,
          color: annotationColor,
          box: { ...draft },
          note,
          serverId,
          etag,
        }
        set((state) => ({ teacherComments: [...state.teacherComments, comment] }))
        get().startNewTeacherComment()
        toast('교사 코멘트를 저장했어요. 다음 문장을 바로 선택할 수 있어요')
      } catch (error) {
        toast(getErrorMessage(error, '교사 코멘트를 저장하지 못했어요. 다시 시도해주세요.'))
      } finally {
        set({ savingComment: false })
      }
    }),
    focusTeacherComment: (id) => {
      get().setToolMode('idle')
      set({ selectedTeacherId: id })
      toast('사진에서 선택한 교사 코멘트를 표시했어요. 드래그해 위치를 바꿀 수 있어요')
    },
    deleteTeacherComment: (id) => mutate(async () => {
      const comment = get().teacherComments.find((item) => item.id === id)
      if (!comment) return
      try {
        await reviewService.deleteComment(get().worksheetId, comment)
      } catch (error) {
        toast(getErrorMessage(error, '교사 코멘트를 삭제하지 못했어요. 다시 시도해주세요.'))
        return
      }
      set((state) => ({
        teacherComments: state.teacherComments.filter((item) => item.id !== id),
        selectedTeacherId: state.selectedTeacherId === id ? null : state.selectedTeacherId,
      }))
      toast('교사 코멘트를 삭제했어요')
    }),
    moveTeacherMark: (id, box) =>
      set((state) => ({
        teacherComments: state.teacherComments.map((comment) =>
          comment.id === id ? { ...comment, box: { ...comment.box, ...box } } : comment,
        ),
      })),
    moveTeacherNote: (id, position) =>
      set((state) => ({
        teacherComments: state.teacherComments.map((comment) =>
          comment.id === id && comment.note ? { ...comment, note: { ...comment.note, ...position } } : comment,
        ),
      })),
    placeTeacherNotes: (notes) =>
      set((state) => ({
        teacherComments: state.teacherComments.map((comment) =>
          comment.note === null && notes[comment.id] ? { ...comment, note: notes[comment.id] } : comment,
        ),
      })),

    // 0.1씩 더할 때 생기는 소수점 오차를 없애려고 소수 첫째 자리로 맞춘다.
    zoomBy: (delta) => set((state) => ({ zoom: clamp(Math.round((state.zoom + delta) * 10) / 10, MIN_ZOOM, MAX_ZOOM) })),
  }
})
