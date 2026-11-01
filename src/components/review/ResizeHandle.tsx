import { usePointerDrag } from '../../hooks/usePointerDrag'
import type { Box } from '../../types/review'
import { cn } from '../../utils/cn'
import { getRect, useCanvasRefs } from './canvasRefs'

type ResizeHandleProps = {
  box: Box
  visible: boolean
  /** 밑줄처럼 높이를 바꾸지 않는 표시 */
  lockHeight?: boolean
  tone: 'ai' | 'teacher'
  onResize: (box: Box) => void
  onResizeEnd: () => void
}

/** 표시의 오른쪽 아래 모서리를 끌어 크기를 바꾼다. */
export function ResizeHandle({ box, visible, lockHeight = false, tone, onResize, onResizeEnd }: ResizeHandleProps) {
  const { photoRef } = useCanvasRefs()
  const { dragging, handlers } = usePointerDrag<{ x: number; y: number; box: Box }>({
    start: (event) => {
      event.preventDefault()
      event.stopPropagation()
      return { x: event.clientX, y: event.clientY, box }
    },
    move: (event, state) => {
      const photo = getRect(photoRef)
      const width = Math.max(
        4,
        Math.min(100 - state.box.left, state.box.width + ((event.clientX - state.x) / photo.width) * 100),
      )
      const height = lockHeight
        ? Math.max(2, state.box.height)
        : Math.max(2, Math.min(100 - state.box.top, state.box.height + ((event.clientY - state.y) / photo.height) * 100))
      onResize({ ...state.box, width, height })
    },
    end: onResizeEnd,
  })

  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -right-1.5 -bottom-1.5 z-12 size-3 cursor-nwse-resize touch-none rounded-full border-2 border-white',
        tone === 'ai'
          ? 'bg-[rgba(255,213,32,0.42)] shadow-[0_0_0_1px_rgba(197,150,3,0.28)]'
          : 'bg-[#665fe5] shadow-[0_1px_5px_rgba(36,42,96,0.32)]',
        visible || dragging ? 'block' : 'hidden',
      )}
      {...handlers}
    />
  )
}
