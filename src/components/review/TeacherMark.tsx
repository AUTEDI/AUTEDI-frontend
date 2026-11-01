import { movedEnough, usePointerDrag } from '../../hooks/usePointerDrag'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { AnnotationColor, AnnotationStyle, Box, SelectionBox, TeacherComment } from '../../types/review'
import { clamp } from '../../utils/annotation'
import { cn } from '../../utils/cn'
import { RESIZABLE_STYLES, teacherMarkClass } from './annotationStyles'
import { getRect, useCanvasRefs } from './canvasRefs'
import { ResizeHandle } from './ResizeHandle'

function boxStyle(box: Box) {
  return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

/** 드래그 중인 교사 표시 미리보기 */
export function TeacherDraftMark({
  draft,
  style,
  color,
}: {
  draft: SelectionBox
  style: AnnotationStyle
  color: AnnotationColor
}) {
  return (
    <div
      className={cn('pointer-events-none absolute z-[7] block', teacherMarkClass(style, color, draft.reverse))}
      style={boxStyle(draft)}
    />
  )
}

/** 저장된 교사 표시. 끌어서 옮기고 더블클릭하면 코멘트와 함께 지운다. */
export function TeacherMark({ comment, selected }: { comment: TeacherComment; selected: boolean }) {
  const { photoRef } = useCanvasRefs()
  const moveTeacherMark = useReviewStore((state) => state.moveTeacherMark)
  const deleteTeacherComment = useReviewStore((state) => state.deleteTeacherComment)
  const showToast = useAppStore((state) => state.showToast)

  const { dragging, handlers } = usePointerDrag<{ x: number; y: number; box: Box; moved: boolean }>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      return { x: event.clientX, y: event.clientY, box: comment.box, moved: false }
    },
    move: (event, state) => {
      const photo = getRect(photoRef)
      if (movedEnough(state.x, state.y, event)) state.moved = true
      moveTeacherMark(comment.id, {
        ...state.box,
        left: clamp(state.box.left + ((event.clientX - state.x) / photo.width) * 100, 0, 100 - state.box.width),
        top: clamp(state.box.top + ((event.clientY - state.y) / photo.height) * 100, 0, 100 - state.box.height),
      })
    },
    end: (state) => {
      if (state.moved) showToast('첨삭 표시 위치를 옮겼어요')
    },
  })

  return (
    <button
      className={cn(
        'absolute z-[7] block touch-none p-0',
        teacherMarkClass(comment.style, comment.color, comment.box.reverse),
        selected && 'shadow-[0_0_0_2px_rgba(105,63,199,0.14)]',
        dragging && 'cursor-grabbing opacity-82',
      )}
      onDoubleClick={() => void deleteTeacherComment(comment.id)}
      style={boxStyle(comment.box)}
      title="드래그해 이동 · 더블클릭해 표시와 코멘트 삭제"
      type="button"
      {...handlers}
    >
      {RESIZABLE_STYLES.includes(comment.style) && (
        <ResizeHandle
          box={comment.box}
          onResize={(box) => moveTeacherMark(comment.id, box)}
          onResizeEnd={() => showToast('AI 표시의 크기와 길이를 조정했어요')}
          tone="teacher"
          visible={selected}
        />
      )}
    </button>
  )
}
