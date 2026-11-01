import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type DragHandlers<S> = {
  /** 드래그를 시작할 때 상태를 만든다. null을 돌려주면 드래그하지 않는다. */
  start: (event: ReactPointerEvent<HTMLElement>) => S | null
  move: (event: ReactPointerEvent<HTMLElement>, state: S) => void
  end?: (state: S) => void
}

/**
 * 포인터 캡처 기반 드래그. 요소 밖으로 포인터가 나가도 이동이 이어진다.
 * dragging은 이동 중 스타일(반투명, grabbing 커서)에 쓴다.
 */
export function usePointerDrag<S>({ start, move, end }: DragHandlers<S>) {
  const stateRef = useRef<S | null>(null)
  const [dragging, setDragging] = useState(false)

  return {
    dragging,
    handlers: {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        const state = start(event)
        if (state === null) return
        stateRef.current = state
        event.currentTarget.setPointerCapture?.(event.pointerId)
        setDragging(true)
      },
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        if (stateRef.current !== null) move(event, stateRef.current)
      },
      onPointerUp() {
        const state = stateRef.current
        if (state === null) return
        stateRef.current = null
        setDragging(false)
        end?.(state)
      },
    },
  }
}

/** 3px 넘게 움직였으면 클릭이 아니라 드래그로 본다. */
export function movedEnough(startX: number, startY: number, event: { clientX: number; clientY: number }) {
  return Math.hypot(event.clientX - startX, event.clientY - startY) > 3
}
