import { useReviewStore } from '../../stores/useReviewStore'
import type { AnnotationColor } from '../../types/review'
import { placeTeacherNote } from '../../utils/annotation'
import { cn } from '../../utils/cn'
import { Button } from '../common/Button'
import { ANNOTATION_STYLES, noteInkClass } from './annotationStyles'
import { COMMENT_INPUT_ID, getRect, useCanvasRefs } from './canvasRefs'

const MAX_COMMENT_LENGTH = 200
const OPTION_LABEL = 'mb-[7px] block text-[7px] font-extrabold text-[#70768a]'
const OPTION_BUTTON = 'h-[34px] rounded-lg border text-[8px] font-[750]'
const OPTION_IDLE = 'border-[#dfe2eb] bg-white text-[#5f6579]'

const COLORS: { id: AnnotationColor; name: string; dot: string; active: string }[] = [
  { id: 'blue', name: '파란색', dot: 'bg-improvement', active: 'border-improvement bg-[#eef5ff] text-improvement-ink' },
  { id: 'red', name: '빨간색', dot: 'bg-correction', active: 'border-correction bg-[#fff0f3] text-[#e82c4c]' },
  { id: 'yellow', name: '노란색', dot: 'bg-[#f2b500]', active: 'border-[#f2b500] bg-[#fff8dc] text-[#b98700]' },
  { id: 'green', name: '초록색', dot: 'bg-applied', active: 'border-applied bg-[#e9f8f3] text-[#0d936d]' },
]

function SavedTeacherComments() {
  const teacherComments = useReviewStore((state) => state.teacherComments)
  const startNewTeacherComment = useReviewStore((state) => state.startNewTeacherComment)
  const focusTeacherComment = useReviewStore((state) => state.focusTeacherComment)
  const deleteTeacherComment = useReviewStore((state) => state.deleteTeacherComment)

  return (
    <div className="mt-4 border-t border-[#e5e7ef] pt-[13px]">
      <div className="flex items-center justify-between">
        <b className="text-[8px]">저장된 코멘트</b>
        <button
          className="rounded-[7px] bg-[#eef0ff] px-2 py-1.5 text-[7px] font-extrabold text-[#4f5fd2]"
          onClick={startNewTeacherComment}
          type="button"
        >
          ＋ 새 코멘트
        </button>
      </div>
      <div className="mt-[9px] grid gap-[7px]">
        {teacherComments.length ? (
          teacherComments.map((comment, index) => (
            <div className="grid grid-cols-[minmax(0,1fr)_27px] gap-[5px]" key={comment.id}>
              <button
                className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e2e4ed] bg-white p-2 text-left text-[#52586b]"
                onClick={() => {
                  focusTeacherComment(comment.id)
                  document
                    .querySelector(`[data-teacher-note="${comment.id}"]`)
                    ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
                }}
                type="button"
              >
                <b className={cn('text-[7px]', comment.color !== 'blue' && noteInkClass(comment.color))}>
                  {String(index + 1).padStart(2, '0')}
                </b>
                <span className="truncate text-[7px] leading-[1.35]">{comment.text}</span>
              </button>
              <button
                aria-label="교사 코멘트 삭제"
                className="rounded-lg border border-[#ffd8df] bg-[#fff5f7] text-[13px] text-[#e43756] hover:bg-[#ffe7ec]"
                onClick={() => void deleteTeacherComment(comment.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <p className="text-[7px] text-[#9a9ead]">아직 저장된 교사 코멘트가 없어요.</p>
        )}
      </div>
    </div>
  )
}

export function TeacherCommentEditor() {
  const { photoRef, boardRef } = useCanvasRefs()
  const annotationStyle = useReviewStore((state) => state.annotationStyle)
  const annotationColor = useReviewStore((state) => state.annotationColor)
  const commentText = useReviewStore((state) => state.commentText)
  const draftReady = useReviewStore((state) => state.draftReady)
  const beginAnnotation = useReviewStore((state) => state.beginAnnotation)
  const setAnnotationColor = useReviewStore((state) => state.setAnnotationColor)
  const setCommentText = useReviewStore((state) => state.setCommentText)
  const cancelTeacherComment = useReviewStore((state) => state.cancelTeacherComment)
  const saveTeacherComment = useReviewStore((state) => state.saveTeacherComment)
  const savingComment = useReviewStore((state) => state.savingComment)

  const canSave = draftReady && commentText.trim().length > 0 && !savingComment

  const save = () => {
    const { draft, teacherComments } = useReviewStore.getState()
    if (!canSave || !draft) return
    const photo = getRect(photoRef)
    void saveTeacherComment(
      placeTeacherNote({
        board: getRect(boardRef),
        photo,
        selection: { top: photo.top + (draft.top / 100) * photo.height },
        occupiedTops: teacherComments.flatMap((comment) => (comment.note ? [comment.note.top] : [])),
      }),
    )
  }

  return (
    <section className="min-h-0">
      <div className="flex items-start gap-[10px]">
        <span className="grid size-[35px] shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(135deg,#eeebff,#dfe4ff)] text-[10px] font-black text-[#5363da]">
          T+
        </span>
        <div>
          <h3 className="mt-px mb-1 text-[13px]">선택한 문장에 피드백</h3>
          <p className="text-[7px] leading-[1.45] text-[#9397a6]">강조 방식과 색상을 고르고 코멘트를 남겨주세요.</p>
        </div>
      </div>
      <div className="mt-[18px] mb-[14px] grid gap-3">
        <div>
          <span className={OPTION_LABEL}>코멘트 연결 표시</span>
          <div className="grid grid-cols-3 gap-[7px]">
            {ANNOTATION_STYLES.map((style) => (
              <button
                aria-pressed={annotationStyle === style.id}
                className={cn(
                  OPTION_BUTTON,
                  'px-[7px]',
                  annotationStyle === style.id ? 'border-[#7784ec] bg-[#edeefe] text-[#4e5cd5]' : OPTION_IDLE,
                )}
                key={style.id}
                onClick={() => beginAnnotation(style.id)}
                type="button"
              >
                {style.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className={OPTION_LABEL}>첨삭 색상</span>
          <div className="grid grid-cols-2 gap-[7px]">
            {COLORS.map((color) => (
              <button
                aria-pressed={annotationColor === color.id}
                className={cn(
                  OPTION_BUTTON,
                  'flex items-center justify-center gap-1.5 px-3',
                  annotationColor === color.id ? color.active : OPTION_IDLE,
                )}
                key={color.id}
                onClick={() => setAnnotationColor(color.id)}
                type="button"
              >
                <i className={cn('size-[9px] rounded-full', color.dot)} />
                {color.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label className="relative block" htmlFor={COMMENT_INPUT_ID}>
        <span className="mb-[7px] block text-[8px] font-extrabold">교사 코멘트</span>
        <textarea
          className="block h-[145px] w-full resize-none rounded-[10px] border border-[#d9ddea] p-3 text-[9px] leading-[1.6] outline-none focus:border-[#7684e8] focus:shadow-[0_0_0_3px_#eef0ff] max-lg:h-[120px]"
          id={COMMENT_INPUT_ID}
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="학생에게 남길 코멘트를 입력하세요"
          value={commentText}
        />
        <small className="absolute right-[9px] bottom-[9px] text-[6px] text-[#a0a4b2]">
          <b>{commentText.length}</b> / {MAX_COMMENT_LENGTH}
        </small>
      </label>
      <div className="mt-[13px] flex justify-end gap-[7px]">
        <Button className="min-w-[72px]" onClick={cancelTeacherComment} size="sm">
          취소
        </Button>
        <Button
          className="disabled:opacity-40 disabled:shadow-none"
          disabled={!canSave}
          onClick={save}
          size="sm"
          variant="primary"
        >
          {savingComment ? '저장 중…' : '코멘트 저장'}
        </Button>
      </div>
      <SavedTeacherComments />
    </section>
  )
}
