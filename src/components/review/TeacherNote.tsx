import { usePointerDrag } from '../../hooks/usePointerDrag'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { TeacherComment } from '../../types/review'
import { cn } from '../../utils/cn'
import { getRect, useCanvasRefs } from './canvasRefs'

/** 사진 옆 여백에 손글씨로 적힌 교사 코멘트 */
export function TeacherNote({
  comment,
  note,
  selected,
}: {
  comment: TeacherComment
  note: NonNullable<TeacherComment['note']>
  selected: boolean
}) {
  const { boardRef } = useCanvasRefs()
  const moveTeacherNote = useReviewStore((state) => state.moveTeacherNote)
  const showToast = useAppStore((state) => state.showToast)

  const { dragging, handlers } = usePointerDrag<{ dx: number; dy: number }>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      return { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    },
    move: (event, state) => {
      const board = getRect(boardRef)
      const rect = event.currentTarget.getBoundingClientRect()
      moveTeacherNote(comment.id, {
        left: Math.max(6, Math.min(board.width - rect.width - 6, event.clientX - board.left - state.dx)),
        top: Math.max(6, Math.min(board.height - rect.height - 6, event.clientY - board.top - state.dy)),
      })
    },
    end: () => showToast('교사 코멘트 위치를 옮겼어요'),
  })

  return (
    <article
      className={cn(
        'pointer-events-auto absolute z-[8] block touch-none px-2 py-[3px] font-hand select-none',
        selected
          ? 'text-[#5b35b8] drop-shadow-[0_2px_0_rgba(91,53,184,0.16)]'
          : comment.color === 'red'
            ? 'text-correction-ink'
            : 'text-improvement-ink',
        dragging && 'cursor-grabbing opacity-88',
      )}
      data-teacher-note={comment.id}
      style={{ left: note.left, top: note.top, width: note.width }}
      {...handlers}
    >
      <p className="m-0 text-[14px] leading-[1.35] font-semibold tracking-[0.15px] break-words [text-shadow:0_0.4px_0_rgba(23,77,145,0.28)]">
        {comment.text}
      </p>
    </article>
  )
}
