import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { movedEnough, usePointerDrag } from '../../hooks/usePointerDrag'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { AiFeedback } from '../../types/review'
import { clampAiNotePosition, placeAiNote, type Rect, type Size } from '../../utils/annotation'
import { cn } from '../../utils/cn'
import { getRect, useCanvasRefs } from './canvasRefs'

type DragState = { dx: number; dy: number; x: number; y: number; moved: boolean }

/** 사진 옆에 손글씨처럼 적힌 AI 추천 문장 */
export function AiNote({ item, dismissed, layout }: {
  item: AiFeedback
  dismissed: boolean
  layout: { board: Rect; photo: Rect; zoom: number }
}) {
  const { photoRef, boardRef } = useCanvasRefs()
  const selectFeedback = useReviewStore((state) => state.selectFeedback)
  const moveAiNote = useReviewStore((state) => state.moveAiNote)
  const showToast = useAppStore((state) => state.showToast)
  const suppressClick = useRef(false)
  const noteRef = useRef<HTMLButtonElement>(null)
  const [noteSize, setNoteSize] = useState<Size | null>(null)

  useLayoutEffect(() => {
    const note = noteRef.current
    if (!note) return
    const observer = new ResizeObserver(() => {
      setNoteSize({ width: note.offsetWidth, height: note.offsetHeight })
    })
    observer.observe(note)
    return () => observer.disconnect()
  }, [])

  const { dragging, handlers } = usePointerDrag<DragState>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      return { dx: event.clientX - rect.left, dy: event.clientY - rect.top, x: event.clientX, y: event.clientY, moved: false }
    },
    move: (event, state) => {
      const photo = getRect(photoRef)
      const board = getRect(boardRef)
      const note = event.currentTarget.getBoundingClientRect()
      if (movedEnough(state.x, state.y, event)) state.moved = true
      const position = clampAiNotePosition(
        { x: event.clientX - state.dx, y: event.clientY - state.dy },
        { x: photo.left, y: photo.top, width: photo.width, height: photo.height },
        { x: board.left, y: board.top, width: board.width, height: board.height },
        note,
      )
      moveAiNote(item.id, {
        left: ((position.x - photo.left) / photo.width) * 100,
        top: ((position.y - photo.top) / photo.height) * 100,
      })
    },
    end: (state) => {
      suppressClick.current = state.moved
      if (state.moved) showToast('AI 첨삭 위치를 옮겼어요')
    },
  })

  const { board, photo, zoom } = layout
  // 문장도 이미지와 함께 확대되므로 실제 화면에 표시되는 크기로 경계를 계산한다.
  const renderedSize = { width: (noteSize?.width ?? 0) * zoom, height: (noteSize?.height ?? 0) * zoom }
  const position = item.notePosition
    ? clampAiNotePosition({
        x: photo.x + (item.notePosition.left / 100) * photo.width,
        y: photo.y + (item.notePosition.top / 100) * photo.height,
      }, photo, board, renderedSize)
    : placeAiNote(photo, board, renderedSize, item.notePlacement.side, item.notePlacement.top)
  const style: CSSProperties = {
    left: `${((position.x - photo.x) / photo.width) * 100}%`,
    top: `${((position.y - photo.y) / photo.height) * 100}%`,
    maxWidth: Math.max(0, board.width - 16) / zoom,
    maxHeight: Math.max(0, board.height - 16) / zoom,
    visibility: noteSize ? 'visible' : 'hidden',
  }

  return (
    <button
      className={cn(
        'absolute z-[8] w-[136px] touch-none overflow-auto px-[5px] py-0.5 text-left font-hand select-none',
        'sm:max-lg:w-[106px] max-sm:w-[78px]',
        item.kind === 'correction' ? 'text-correction-ink' : 'text-improvement-ink',
        dragging && 'cursor-grabbing opacity-82',
        dismissed && 'hidden',
      )}
      onClick={(event) => {
        event.stopPropagation()
        if (suppressClick.current) {
          suppressClick.current = false
          return
        }
        selectFeedback(item.id)
      }}
      style={style}
      ref={noteRef}
      type="button"
      {...handlers}
    >
      <p className="m-0 text-[13px] leading-[1.28] font-semibold tracking-[0.1px] break-words whitespace-pre-line [text-shadow:0_0.35px_0_rgba(18,69,132,0.32)] sm:max-lg:text-[11px] max-sm:text-[8px]">
        {item.noteText}
      </p>
    </button>
  )
}
