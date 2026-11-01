import { useRef, type CSSProperties } from 'react'
import { movedEnough, usePointerDrag } from '../../hooks/usePointerDrag'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { AiFeedback } from '../../types/review'
import { cn } from '../../utils/cn'
import { getRect, useCanvasRefs } from './canvasRefs'

type DragState = { dx: number; dy: number; x: number; y: number; moved: boolean }

/** 사진 옆에 손글씨처럼 적힌 AI 추천 문장 */
export function AiNote({ item, dismissed }: { item: AiFeedback; dismissed: boolean }) {
  const { photoRef } = useCanvasRefs()
  const selectFeedback = useReviewStore((state) => state.selectFeedback)
  const moveAiNote = useReviewStore((state) => state.moveAiNote)
  const showToast = useAppStore((state) => state.showToast)
  const suppressClick = useRef(false)

  const { dragging, handlers } = usePointerDrag<DragState>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      const rect = event.currentTarget.getBoundingClientRect()
      return { dx: event.clientX - rect.left, dy: event.clientY - rect.top, x: event.clientX, y: event.clientY, moved: false }
    },
    move: (event, state) => {
      const photo = getRect(photoRef)
      if (movedEnough(state.x, state.y, event)) state.moved = true
      moveAiNote(item.id, {
        left: Math.max(-42, Math.min(102, ((event.clientX - photo.left - state.dx) / photo.width) * 100)),
        top: Math.max(0, Math.min(94, ((event.clientY - photo.top - state.dy) / photo.height) * 100)),
      })
    },
    end: (state) => {
      suppressClick.current = state.moved
      if (state.moved) showToast('AI 첨삭 위치를 옮겼어요')
    },
  })

  const { notePlacement: placement, notePosition: position } = item
  // 옮기기 전에는 화면 크기에 맞춘 기본 위치를, 옮긴 뒤에는 그 좌표를 쓴다.
  const positionClass = position
    ? undefined
    : cn(
        placement.side === 'right' ? 'left-[100.5%] sm:max-lg:left-full' : 'right-[100.5%] sm:max-lg:right-full',
        'top-(--note-top) max-sm:top-(--note-top-mobile) max-sm:right-full max-sm:left-auto',
      )
  const style: CSSProperties = position
    ? { left: `${position.left}%`, top: `${position.top}%` }
    : ({ '--note-top': `${placement.top}%`, '--note-top-mobile': `${placement.mobileTop}%` } as CSSProperties)

  return (
    <button
      className={cn(
        'absolute z-[8] max-w-[136px] min-w-[128px] touch-none px-[5px] py-0.5 text-left font-hand select-none',
        'sm:max-lg:max-w-[106px] sm:max-lg:min-w-[96px] max-sm:max-w-[78px] max-sm:min-w-[72px]',
        item.kind === 'correction' ? 'text-correction-ink' : 'text-improvement-ink',
        positionClass,
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
      type="button"
      {...handlers}
    >
      <p className="m-0 text-[13px] leading-[1.28] font-semibold tracking-[0.1px] whitespace-pre-line [text-shadow:0_0.35px_0_rgba(18,69,132,0.32)] sm:max-lg:text-[11px] max-sm:text-[8px]">
        {item.noteText}
      </p>
    </button>
  )
}
