import { createContext, useContext, type RefObject } from 'react'

type CanvasRefs = {
  /** 학습지 사진 요소. 첨삭 표시 좌표의 기준이다. */
  photoRef: RefObject<HTMLDivElement | null>
  /** 사진을 감싸는 캔버스 영역. 교사 코멘트 좌표의 기준이다. */
  boardRef: RefObject<HTMLDivElement | null>
}

export const CanvasRefsContext = createContext<CanvasRefs | null>(null)

/** 표시를 다 그리면 바로 입력할 수 있도록 포커스를 옮길 교사 코멘트 입력창 */
export const COMMENT_INPUT_ID = 'teacher-comment-input'

export function useCanvasRefs() {
  const refs = useContext(CanvasRefsContext)
  if (!refs) throw new Error('useCanvasRefs는 CanvasRefsContext 안에서만 쓸 수 있어요.')
  return refs
}

export function getRect(ref: RefObject<HTMLElement | null>) {
  const element = ref.current
  if (!element) throw new Error('캔버스 요소가 아직 준비되지 않았어요.')
  return element.getBoundingClientRect()
}
