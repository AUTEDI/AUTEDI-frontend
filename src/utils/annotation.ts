import type { AnnotationStyle, SelectionBox } from '../types/review'

export type Point = { x: number; y: number }
export type Size = { width: number; height: number }
export type Rect = Point & Size

const AI_NOTE_OUTSIDE_LIMIT = 200
const AI_NOTE_IMAGE_GAP = 16
const AI_NOTE_CANVAS_PADDING = 8

/** 문장 전체를 캔버스 안에 두고, 이미지 양옆으로 나가는 거리는 최대 200px로 제한한다. */
export function clampAiNotePosition(position: Point, photo: Rect, board: Rect, note: Size): Point {
  const minX = Math.max(board.x + AI_NOTE_CANVAS_PADDING, photo.x - AI_NOTE_OUTSIDE_LIMIT)
  const maxX = Math.min(
    board.x + board.width - AI_NOTE_CANVAS_PADDING - note.width,
    photo.x + photo.width + AI_NOTE_OUTSIDE_LIMIT - note.width,
  )
  const minY = board.y + AI_NOTE_CANVAS_PADDING
  const maxY = board.y + board.height - AI_NOTE_CANVAS_PADDING - note.height
  return {
    x: clamp(position.x, minX, Math.max(minX, maxX)),
    y: clamp(position.y, minY, Math.max(minY, maxY)),
  }
}

/** 첫 문장은 이미지에서 16px 떨어뜨리고, 여백이 모자라면 반대편을 먼저 확인한다. */
export function placeAiNote(photo: Rect, board: Rect, note: Size, side: 'left' | 'right', top: number): Point {
  const left = photo.x - AI_NOTE_IMAGE_GAP - note.width
  const right = photo.x + photo.width + AI_NOTE_IMAGE_GAP
  const fits = (x: number) => x >= board.x + AI_NOTE_CANVAS_PADDING
    && x >= photo.x - AI_NOTE_OUTSIDE_LIMIT
    && x + note.width <= board.x + board.width - AI_NOTE_CANVAS_PADDING
    && x + note.width <= photo.x + photo.width + AI_NOTE_OUTSIDE_LIMIT
  const preferred = side === 'left' ? left : right
  const opposite = side === 'left' ? right : left
  return clampAiNotePosition({
    x: fits(preferred) ? preferred : fits(opposite) ? opposite : preferred,
    y: photo.y + (top / 100) * photo.height,
  }, photo, board, note)
}

/** 원본 비율을 유지하면서 주어진 영역 안에 이미지 전체가 들어가는 크기를 계산한다. */
export function fitImageSize(image: Size, bounds: Size): Size | null {
  if (![image.width, image.height, bounds.width, bounds.height].every((value) => Number.isFinite(value) && value > 0)) {
    return null
  }
  const scale = Math.min(bounds.width / image.width, bounds.height / image.height)
  return { width: image.width * scale, height: image.height * scale }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** 화면 좌표를 사진 기준 퍼센트(0~100) 좌표로 바꾼다. */
export function pointInRect(clientX: number, clientY: number, rect: DOMRect): Point {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
  }
}

/** 드래그 시작점과 현재 점으로 표시 영역을 만든다. 표시 종류마다 최소 크기가 다르다. */
export function selectionFromPoints(start: Point, end: Point, style: AnnotationStyle): SelectionBox {
  const horizontal = style === 'arrow'
  const minWidth = ['arrow', 'box', 'caret'].includes(style) ? 4 : 1
  const minHeight = style === 'underline' ? 1 : ['box', 'caret'].includes(style) ? 3 : 1.8
  return {
    left: Math.min(start.x, end.x),
    top: horizontal ? start.y : Math.min(start.y, end.y),
    width: Math.max(minWidth, Math.abs(end.x - start.x)),
    height: horizontal ? 1.4 : Math.max(minHeight, Math.abs(end.y - start.y)),
    reverse: horizontal && end.x < start.x,
  }
}

/**
 * 교사 코멘트를 사진 옆 여백에 배치한다.
 * 오른쪽 여백이 부족하면 왼쪽에 두고, 이미 있는 코멘트와 겹치면 아래로 내린다.
 */
export function placeTeacherNote({
  board,
  photo,
  selection,
  occupiedTops,
}: {
  board: DOMRect
  photo: DOMRect
  selection: { top: number }
  occupiedTops: number[]
}) {
  const sideSpace = Math.max(52, photo.left - board.left - 10)
  const width = board.width < 500 ? Math.min(76, sideSpace) : Math.min(190, Math.max(118, board.width * 0.22))
  let left = photo.right - board.left + 8
  if (left + width > board.width - 6) left = Math.max(4, photo.left - board.left - width - 6)
  let top = Math.max(6, Math.min(board.height - 82, selection.top - board.top - 6))
  while (occupiedTops.some((y) => Math.abs(y - top) < 58) && top < board.height - 94) top += 62
  return { left, top, width }
}
