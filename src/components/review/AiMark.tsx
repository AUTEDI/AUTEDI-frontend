import { useRef } from 'react'
import { BASE_SETTINGS } from '../../constants/settings'
import { movedEnough, usePointerDrag } from '../../hooks/usePointerDrag'
import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import type { AiFeedback, Box } from '../../types/review'
import { clamp } from '../../utils/annotation'
import { cn } from '../../utils/cn'
import { getRect, useCanvasRefs } from './canvasRefs'
import { ResizeHandle } from './ResizeHandle'

function markFillClass(item: AiFeedback, active: boolean, applied: boolean) {
  const correction = item.kind === 'correction'
  if (item.markStyle === 'underline') {
    return cn('bg-transparent', correction ? 'border-b-correction' : 'border-b-improvement', active ? 'border-b-3' : 'border-b-2')
  }
  if (active) return correction ? 'bg-[rgba(255,62,91,0.25)]' : 'bg-[rgba(52,124,255,0.24)]'
  if (applied) return 'bg-[rgba(24,174,132,0.18)]'
  return correction ? 'bg-[rgba(255,62,91,0.16)]' : 'bg-[rgba(52,124,255,0.14)]'
}

type AiMarkProps = {
  item: AiFeedback
  active: boolean
  applied: boolean
  dismissed: boolean
  mark: Box
}

/** 사진 위 AI 첨삭 표시. 끌어서 옮기고 모서리로 크기를 바꾼다. */
export function AiMark({ item, mark, active, applied, dismissed }: AiMarkProps) {
  const { photoRef } = useCanvasRefs()
  const selectFeedback = useReviewStore((state) => state.selectFeedback)
  const moveAiMark = useReviewStore((state) => state.moveAiMark)
  const showToast = useAppStore((state) => state.showToast)
  // 드래그나 크기 조절 직후의 클릭은 선택으로 보지 않는다.
  const suppressClick = useRef(false)

  const { dragging, handlers } = usePointerDrag<{ x: number; y: number; box: Box; moved: boolean }>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      return { x: event.clientX, y: event.clientY, box: mark, moved: false }
    },
    move: (event, state) => {
      const photo = getRect(photoRef)
      if (movedEnough(state.x, state.y, event)) state.moved = true
      moveAiMark(item.id, {
        ...state.box,
        left: clamp(state.box.left + ((event.clientX - state.x) / photo.width) * 100, 0, 100 - state.box.width),
        top: clamp(state.box.top + ((event.clientY - state.y) / photo.height) * 100, 0, 100 - state.box.height),
      })
    },
    end: (state) => {
      suppressClick.current = state.moved
      if (state.moved) showToast('AI 표시 위치를 옮겼어요')
    },
  })

  const settingName = BASE_SETTINGS.find((setting) => setting.en === item.category)?.name ?? item.category

  return (
    <button
      aria-label={`${settingName} ${item.kind === 'correction' ? '오류 수정' : '개선 제안'}`}
      className={cn(
        'absolute z-[6] block touch-none p-0',
        markFillClass(item, active, applied),
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
      style={{
        left: `${mark.left}%`,
        top: `${mark.top}%`,
        width: `${mark.width}%`,
        height: `${mark.height}%`,
      }}
      type="button"
      {...handlers}
    >
      <ResizeHandle
        box={mark}
        lockHeight={item.markStyle === 'underline'}
        onResize={(box) => moveAiMark(item.id, box)}
        onResizeEnd={() => {
          suppressClick.current = true
          showToast('AI 표시의 크기와 길이를 조정했어요')
        }}
        tone="ai"
        visible={active}
      />
    </button>
  )
}
