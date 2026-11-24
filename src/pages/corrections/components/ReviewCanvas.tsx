import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { Correction, HighlightType, Region, ReviewPage, TeacherComment } from '../../../apis/review'
import { toneOf, type CommentKind, type CommentTool } from './commentTools'
import { areaOf } from './correctionAreas'
import EditorToolbar from './EditorToolbar'
import ZoomControl from './ZoomControl'

type Shape = 'underline' | 'strike' | 'caret-before' | 'caret-after' | 'caret' | 'arrow' | 'highlight' | 'box'

const SHAPE_BY_HIGHLIGHT: Record<HighlightType, Shape> = {
  UNDERLINE: 'underline',
  STRIKETHROUGH: 'strike',
  CARET: 'caret',
  ARROW: 'arrow',
  HIGHLIGHT: 'highlight',
  TEXTBOX: 'box',
}

/**
 * 첨삭의 기준 영역. 삽입은 넣을 자리가 한 곳이라, 앞에 넣기는 첫 영역·뒤에 넣기는 마지막 영역만 쓴다.
 * 나머지 첨삭은 영역마다 표시를 그리고, 메모는 이 페이지의 첫 영역에 단다.
 */
function anchorRegion(correction: Correction, regions: readonly Region[]) {
  if (correction.edit?.operation === 'INSERT') return correction.edit.position === 'AFTER' ? regions.at(-1) : regions[0]
  return undefined
}

/** AI 첨삭의 표시 모양: 삭제는 취소선, 삽입은 앞·뒤 끝의 ∧, 나머지는 밑줄 */
function aiShape(correction: Correction): Shape {
  const operation = correction.edit?.operation
  if (operation === 'DELETE') return 'strike'
  if (operation === 'INSERT') return correction.edit?.position === 'AFTER' ? 'caret-after' : 'caret-before'
  return 'underline'
}

// 수기 첨삭 ∨의 고정 크기(px)
const CARET_SIZE = { width: 14, height: 10 }

// 삽입 표시 ∨: 위 끝을 박스 위 끝에 맞춰 박스 안에 넣고 아래를 가리킨다. 메모는 그 바로 위(박스 위 끝)에 붙인다.
// 크기는 caretHeight로 정한다(높이:폭 = 2:3).
const CARET = 'absolute top-0 bg-current [clip-path:polygon(0_0,20%_0,50%_65%,80%_0,100%_0,50%_100%)]'
// AI 삽입 ∨를 잡는 손잡이. clip-path는 누르는 영역도 잘라 내서, 바깥 틀에 보이지 않는 여유(사방 6px)를 둔다.
const CARET_HANDLE = "absolute top-0 before:absolute before:-inset-[6px] before:content-['']"
const DEFAULT_CARET_HEIGHT = 8

/** 영역 하나에 그리는 표시. 색은 부모의 글자색(currentColor)을 따른다. */
/** handle이면 AI 삽입 ∨가 손잡이가 되어, 박스 대신 ∨를 눌러 고르고 끌 수 있다. */
function Mark({
  shape,
  thick,
  dashed,
  caretHeight = DEFAULT_CARET_HEIGHT,
  handle = false,
}: {
  shape: Shape
  thick: boolean
  dashed?: boolean
  caretHeight?: number
  handle?: boolean
}) {
  const caretSize = { height: caretHeight, width: caretHeight * 1.5 }
  const line = `border-current ${thick ? 'border-b-3' : 'border-b-2'} ${dashed ? 'border-dashed' : ''}`
  switch (shape) {
    case 'strike':
      return <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${line}`} />
    // 단어 첫 글자에 걸치면 단어 안에 넣는 것처럼 보여서, ∨를 박스 밖 단어 사이 공백에 둔다.
    case 'caret-before':
    case 'caret-after':
      return (
        <span
          className={`${CARET_HANDLE} ${shape === 'caret-before' ? 'right-full' : 'left-full'} ${handle ? 'pointer-events-auto cursor-move' : ''}`}
          style={caretSize}
        >
          <span className={`${CARET} left-0 size-full`} />
        </span>
      )
    case 'caret':
      // 수기 첨삭의 ∨는 크기·각도를 고정하고 영역 가운데에 그린다. 위치만 옮길 수 있다.
      return (
        <svg
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
          width={CARET_SIZE.width}
          height={CARET_SIZE.height}
          viewBox={`0 0 ${CARET_SIZE.width} ${CARET_SIZE.height}`}
        >
          <polyline
            points={`1,1 ${CARET_SIZE.width / 2},${CARET_SIZE.height - 1} ${CARET_SIZE.width - 1},1`}
            fill="none"
            stroke="currentColor"
            strokeWidth={thick ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'arrow':
      return (
        <>
          <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${line}`} />
          <span className="absolute top-1/2 right-0 size-[8px] -translate-y-1/2 rotate-45 border-t-2 border-r-2 border-current" />
        </>
      )
    case 'highlight':
      return <span className="absolute inset-0 rounded-[2px] bg-current opacity-20" />
    case 'box':
      return <span className={`absolute inset-0 rounded-[2px] border-2 border-current ${dashed ? 'border-dashed' : ''}`} />
    default:
      return <span className={`absolute inset-x-0 bottom-0 ${line}`} />
  }
}

const regionStyle = (region: Pick<Region, 'x' | 'y' | 'width' | 'height'>): CSSProperties => ({
  left: `${region.x * 100}%`,
  top: `${region.y * 100}%`,
  width: `${region.width * 100}%`,
  height: `${region.height * 100}%`,
})

// 위치가 불확실한 첨삭이 있을 때만 사진 양옆에 비워 두는 여백(px). 그 메모는 글씨 위가 아니라 여기에 적는다.
const GUTTER = 150
const NOTE_HEIGHT = 20
const NOTE_GAP = 4

type Note = {
  key: string
  side: 'left' | 'right'
  text: string
  tone: string
  selected: boolean
  onClick: () => void
  /** 가리키는 표시의 바깥쪽 끝과 세로 가운데(사진 기준 0~1) */
  anchorX: number
  anchorY: number
}

/**
 * 메모의 세로 위치(px)를 정한다. 표시와 같은 높이에 두되, 같은 쪽 메모끼리 겹치면 아래로 민다.
 */
function placeNotes(notes: Note[], height: number) {
  const tops = new Map<string, number>()
  for (const side of ['left', 'right'] as const) {
    let bottom = -Infinity
    notes
      .filter((note) => note.side === side)
      .sort((a, b) => a.anchorY - b.anchorY)
      .forEach((note) => {
        const top = Math.max(note.anchorY * height - NOTE_HEIGHT / 2, bottom + NOTE_GAP)
        tops.set(note.key, top)
        bottom = top + NOTE_HEIGHT
      })
  }
  return tops
}

// 메모 글자 양옆 안쪽 여백(px-ds-4 × 2)과, 메모를 표시에서 띄우는 거리(px)
const NOTE_PADDING = 8
const NOTE_SPACE = 4

// AI 첨삭 메모 글자 크기 = 서버가 준 글자 박스 높이 × 0.7. 박스는 위아래로 튀어나온 획까지 감싸서 실제 글자보다 크다.
const NOTE_FONT_RATIO = 0.7
// shortcut: 박스가 아주 작으면 메모가 읽히지 않아 10px 아래로는 줄이지 않는다, 디자인에서 최소 크기를 정하면 바꾼다.
const MIN_NOTE_FONT = 10
// 메모 상자 높이 = 글자 크기 × 0.7. 흰 배경이 글자에 딱 붙고 메모가 박스 위 끝에 바짝 붙는다(아래 획은 상자 밖으로 조금 나간다).
const NOTE_LINE_HEIGHT = 0.7
const DEFAULT_NOTE_FONT = 12

let measureCanvas: HTMLCanvasElement | null = null
/** 메모 폭(px). 그리기 전에 겹침을 따지려고 글자 폭을 미리 잰다. */
function noteWidth(text: string, fontSize = DEFAULT_NOTE_FONT) {
  measureCanvas ??= document.createElement('canvas')
  const context = measureCanvas.getContext('2d')
  if (!context) return text.length * fontSize * 0.6 + NOTE_PADDING
  context.font = `500 ${fontSize}px Pretendard, sans-serif`
  return Math.ceil(context.measureText(text).width) + NOTE_PADDING
}

type Box = { left: number; top: number; right: number; bottom: number }
// 장애물에 어느 첨삭의 표시인지 붙여, 메모가 자기 박스와 겹치는 건 허용한다.
type Obstacle = Box & { key?: string }
// 밑줄 첨삭 메모를 박스 안으로 내리는 정도(박스 높이 대비). 손글씨 윗부분만 살짝 가리면서 밑줄에 가까워진다.
const NOTE_DROP_RATIO = 0.3
const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/**
 * 사진 위 메모 자리(px)를 정한다. fixed가 있는 메모(삽입 ∨ 위 메모)는 그 자리에 먼저 고정하고,
 * 나머지는 첨삭 표시나 다른 메모와 겹치지 않는 첫 자리를 고른다:
 * 메모 아래 끝이 박스 위 끝에 닿는 자리(밑줄에서 박스 높이만큼 위) → 박스 바로 아래 → 한 줄 더 위 → 한 줄 더 아래,
 * 각각 표시 왼쪽 끝·오른쪽 끝·가운데 맞춤 순서. 빈 자리가 없으면 첫 자리에 둔다.
 */
function placeInlineNotes(
  notes: { key: string; width: number; height: number; region: Box; fixed?: { left: number; top: number } }[],
  obstacles: Obstacle[],
  bounds: { width: number; height: number },
) {
  const placed = new Map<string, { left: number; top: number }>()
  const taken: Obstacle[] = [...obstacles]
  // 고정 메모를 먼저 놓아, 다른 메모가 이 자리를 피해 가게 한다.
  notes.forEach(({ key, width, height, fixed }) => {
    if (!fixed) return
    taken.push({ left: fixed.left, top: fixed.top, right: fixed.left + width, bottom: fixed.top + height })
    placed.set(key, fixed)
  })
  notes
    .filter((note) => !note.fixed)
    .sort((a, b) => a.region.top - b.region.top || a.region.left - b.region.left)
    .forEach(({ key, width, height: h, region }) => {
      // 첫 자리: 메모 아래 끝을 박스 위 끝에서 박스 높이의 30%만큼 안으로 내린 자리.
      const drop = (region.bottom - region.top) * NOTE_DROP_RATIO
      const tops = [region.top + drop - h, region.bottom + NOTE_SPACE, region.top - 2 * h - NOTE_SPACE, region.bottom + h + 2 * NOTE_SPACE]
      const lefts = [region.left, region.right - width, (region.left + region.right - width) / 2]
      const fit = (left: number, top: number): Box => {
        const x = clamp(left, 0, Math.max(0, bounds.width - width))
        const y = clamp(top, 0, Math.max(0, bounds.height - h))
        return { left: x, top: y, right: x + width, bottom: y + h }
      }
      let box = fit(lefts[0], tops[0])
      search: for (const top of tops) {
        for (const left of lefts) {
          const candidate = fit(left, top)
          if (!taken.some((other) => other.key !== key && overlaps(candidate, other))) {
            box = candidate
            break search
          }
        }
      }
      taken.push(box)
      placed.set(key, { left: box.left, top: box.top })
    })
  return placed
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
// 이만큼(px) 이상 움직여야 끌기로 보고, 그보다 작으면 누르기(선택)로 본다.
const DRAG_THRESHOLD = 3

/** 사진 위에서 진행 중인 끌기: 영역 고르기, 사진 옮기기(확대 시), 첨삭 표시 옮기기 */
type Gesture =
  | { type: 'draw'; x0: number; y0: number; x1: number; y1: number }
  | { type: 'pan'; clientX: number; clientY: number; panX: number; panY: number }
  | { type: 'move'; key: string; clientX: number; clientY: number; x0: number; y0: number; dx: number; dy: number; moved: boolean }
  | { type: 'note'; key: string; clientX: number; clientY: number; x0: number; y0: number; x: number; y: number; moved: boolean }

/** 메모의 왼쪽 위 자리(사진 기준 0~1). 옆 여백에 있으면 0보다 작거나 1보다 크다. */
export type NotePosition = { x: number; y: number }

export type ReviewCanvasProps = {
  title: string
  /** 학생 이름. 없으면 학생 칸을 그리지 않는다. */
  student: string
  pages: readonly ReviewPage[]
  /** 페이지 ID별 이미지 주소. 아직 받는 중이면 없다. */
  imageUrls: Readonly<Record<number, string>>
  pageId: number
  onPageChange: (pageId: number) => void
  corrections: readonly Correction[]
  selectedId: number | null
  onSelect: (correctionId: number) => void
  onMoveCorrection: (correctionId: number, regions: Region[]) => void
  comments: readonly TeacherComment[]
  selectedCommentId: number | null
  onSelectComment: (commentId: number) => void
  onMoveComment: (commentId: number, regions: Region[]) => void
  /** 켜진 표시 도구. null이면 손 모드: 표시를 끌어 옮기고, 확대했을 때 사진을 끌어 움직인다. */
  tool: CommentTool | null
  /** 도구 막대에서는 도구와 색(kind)을 함께 고른다. */
  onToolChange: (tool: CommentTool | null, kind?: CommentKind) => void
  kind: CommentKind
  /** 사진에서 골라 둔, 아직 저장하지 않은 수기 첨삭 영역 */
  draft: { region: Region; tool: CommentTool } | null
  onDraw: (region: Region) => void
  /** 선생님이 옮긴 메모 자리. 키는 'ai-{첨삭 ID}' 또는 'comment-{코멘트 ID}'다. 없으면 기본 자리에 둔다. */
  notePositions: Readonly<Record<string, NotePosition>>
  onNoteMove: (key: string, position: NotePosition) => void
}

/** 첨삭 검토 왼쪽: 페이지 목록과 첨삭 표시가 올라간 학습지 사진 */
export default function ReviewCanvas({
  title,
  student,
  pages,
  imageUrls,
  pageId,
  onPageChange,
  corrections,
  selectedId,
  onSelect,
  onMoveCorrection,
  comments,
  selectedCommentId,
  onSelectComment,
  onMoveComment,
  tool,
  onToolChange,
  kind,
  draft,
  onDraw,
  notePositions,
  onNoteMove,
}: ReviewCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const photoRef = useRef<HTMLDivElement>(null)
  // 메모 위치와 이동 범위를 px로 계산하려고 사진 크기를 잰다. 확대(transform)와 상관없는 원래 크기다.
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const photo = photoRef.current
    if (!photo) return
    const observer = new ResizeObserver(() => setSize({ width: photo.offsetWidth, height: photo.offsetHeight }))
    observer.observe(photo)
    return () => observer.disconnect()
  }, [])
  const [gesture, setGesture] = useState<Gesture | null>(null)
  // 처음 받은 AI 첨삭. 메모 자동 배치는 이것으로만 계산해, 선생님이 표시·메모를 옮기거나 지워도 다른 메모가 움직이지 않는다.
  const [serverCorrections] = useState(corrections)
  // 마지막으로 다 그려진 사진 주소. 사진이 뜨기 전에 첨삭 표시만 먼저 보이지 않게 한다.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  // 확대했을 때 사진을 옮긴 거리(px). 다른 페이지거나 100% 이하면 쓰지 않는다.
  const [pan, setPan] = useState({ pageId, x: 0, y: 0 })
  const drawing = tool !== null
  const index = Math.max(0, pages.findIndex((page) => page.id === pageId))
  const page = pages[index]
  const ratio = page.width / page.height
  const photoReady = Boolean(imageUrls[page.id]) && loadedSrc === imageUrls[page.id]

  // 확대한 만큼만 옮길 수 있게 막아 사진이 틀 밖으로 사라지지 않게 한다.
  const maxPanX = (size.width * (zoom - 1)) / 2
  const maxPanY = (size.height * (zoom - 1)) / 2
  const panX = pan.pageId === page.id && zoom > 1 ? clamp(pan.x, -maxPanX, maxPanX) : 0
  const panY = pan.pageId === page.id && zoom > 1 ? clamp(pan.y, -maxPanY, maxPanY) : 0

  // 확대·이동해도 화면에 보이는 사진 크기 기준으로 계산하므로 0~1 좌표가 그대로 맞는다.
  const pointOf = (event: PointerEvent) => {
    const rect = photoRef.current!.getBoundingClientRect()
    return { x: clamp01((event.clientX - rect.left) / rect.width), y: clamp01((event.clientY - rect.top) / rect.height) }
  }

  // 옮기고 있는 표시는 끈 만큼 밀어서 그린다.
  const moving = gesture?.type === 'move' ? gesture : null
  const shifted = (key: string, regions: readonly Region[]): Region[] =>
    regions.map((region) =>
      moving?.key === key && region.pageId === page.id ? { ...region, x: region.x + moving.dx, y: region.y + moving.dy } : region,
    )
  // 이 페이지의 영역이 모두 사진 안에 남도록 옮길 거리를 막는다.
  const limitShift = (regions: readonly Region[], dx: number, dy: number) => {
    const onPage = regions.filter((region) => region.pageId === page.id)
    if (onPage.length === 0) return { dx: 0, dy: 0 }
    return {
      dx: clamp(dx, -Math.min(...onPage.map((r) => r.x)), 1 - Math.max(...onPage.map((r) => r.x + r.width))),
      dy: clamp(dy, -Math.min(...onPage.map((r) => r.y)), 1 - Math.max(...onPage.map((r) => r.y + r.height))),
    }
  }
  const regionsOf = (key: string): readonly Region[] =>
    (key.startsWith('ai-')
      ? corrections.find((item) => `ai-${item.id}` === key)?.regions
      : comments.find((item) => `comment-${item.id}` === key)?.regions) ?? []

  const startMove = (event: PointerEvent, key: string) => {
    if (event.button !== 0) return
    event.stopPropagation()
    // 이어지는 움직임은 사진 틀이 모두 받아 처리한다.
    photoRef.current!.setPointerCapture(event.pointerId)
    const { x, y } = pointOf(event)
    setGesture({ type: 'move', key, clientX: event.clientX, clientY: event.clientY, x0: x, y0: y, dx: 0, dy: 0, moved: false })
  }

  const caretBox = (x: number, y: number) => {
    const width = CARET_SIZE.width / (size.width || 1)
    const height = CARET_SIZE.height / (size.height || 1)
    return { x: clamp(x - width / 2, 0, 1 - width), y: clamp(y - height / 2, 0, 1 - height), width, height }
  }
  const drawRect =
    gesture?.type !== 'draw'
      ? null
      : tool === 'CARET'
        ? caretBox(gesture.x1, gesture.y1)
        : {
            x: Math.min(gesture.x0, gesture.x1),
            y: Math.min(gesture.y0, gesture.y1),
            width: Math.abs(gesture.x1 - gesture.x0),
            height: Math.abs(gesture.y1 - gesture.y0),
          }
  const preview = drawRect ? { region: drawRect, tool: tool ?? 'UNDERLINE' } : draft?.region.pageId === page.id ? draft : null

  // 메모: AI 첨삭은 고칠 말(삭제는 메모 없음), 수기 첨삭은 코멘트.
  // 기본 자리는 위치가 확실하면 표시 바로 위, 서버가 위치를 확신하지 못하면 사진 옆 여백이다.
  // 선과 메모는 따로 움직인다: 기본 자리는 옮기기 전 영역으로 계산하고, 선생님이 옮긴 메모는 그 자리(notePositions)에 둔다.
  const noteText = (correction: Correction) => (correction.edit?.operation === 'DELETE' ? '' : correction.edit?.text || correction.content)
  // fontSize가 있으면 AI 첨삭 메모다(사진 위). 수기 첨삭·옆 여백 메모는 기본 12px이다.
  type NoteItem = {
    key: string
    text: string
    tone: string
    selected: boolean
    select: () => void
    uncertain: boolean
    region: Region
    fontSize: number
  }
  // AI 첨삭 메모 글자 크기: 원본 글씨와 비슷하게 박스 높이에서 추측한다.
  const aiNoteFont = (region: Region) => Math.max(MIN_NOTE_FONT, region.height * size.height * NOTE_FONT_RATIO)
  const items: NoteItem[] = []
  corrections.forEach((correction) => {
    const insertAt = anchorRegion(correction, correction.regions)
    const region = correction.edit?.operation === 'INSERT'
      ? insertAt?.pageId === page.id ? insertAt : undefined
      : correction.regions.find((item) => item.pageId === page.id)
    const text = noteText(correction)
    if (!region || !text) return
    items.push({
      key: `ai-${correction.id}`,
      text,
      tone: correction.feedbackType === 'CORRECTION' ? 'text-text-accent-red' : 'text-text-brand-strong',
      selected: correction.id === selectedId,
      select: () => onSelect(correction.id),
      uncertain: correction.locationUncertain,
      region,
      fontSize: correction.locationUncertain ? DEFAULT_NOTE_FONT : aiNoteFont(region),
    })
  })
  comments.forEach((comment) => {
    const region = comment.regions.find((item) => item.pageId === page.id)
    if (!region || !comment.content) return
    items.push({
      key: `comment-${comment.id}`,
      text: comment.content,
      tone: toneOf(comment.color),
      selected: comment.id === selectedCommentId,
      select: () => onSelectComment(comment.id),
      uncertain: false,
      region,
      fontSize: DEFAULT_NOTE_FONT,
    })
  })
  // 옆 여백 메모는 표시와 같은 높이에 두되 같은 쪽끼리 겹치지 않게 쌓는다.
  const sideNotes: Note[] = items
    .filter((item) => item.uncertain)
    .map((item) => ({
      ...item,
      side: item.region.x + item.region.width / 2 < 0.5 ? 'left' : 'right',
      onClick: item.select,
      anchorX: 0,
      anchorY: item.region.y + item.region.height / 2,
    }))
  const sideTops = size.height ? placeNotes(sideNotes, size.height) : new Map<string, number>()
  // AI 첨삭 메모는 서버에서 처음 받은 데이터로만 겹치지 않게 배치한다(px로 계산).
  // 선생님이 직접 옮긴 메모나 새로 단 수기 첨삭은 배치에 넣지 않아, 겹치더라도 다른 메모를 밀지 않는다.
  const toBox = (region: Region): Box => ({
    left: region.x * size.width,
    top: region.y * size.height,
    right: (region.x + region.width) * size.width,
    bottom: (region.y + region.height) * size.height,
  })
  const serverMarkBoxes: Obstacle[] = serverCorrections.flatMap((item) =>
    item.regions.filter((region) => region.pageId === page.id).map((region) => ({ ...toBox(region), key: `ai-${item.id}` })),
  )
  const autoPlaced = size.width
    ? placeInlineNotes(
        serverCorrections.flatMap((correction) => {
          const insertAt = anchorRegion(correction, correction.regions)
          const region = correction.edit?.operation === 'INSERT'
            ? insertAt?.pageId === page.id ? insertAt : undefined
            : correction.regions.find((item) => item.pageId === page.id)
          const text = noteText(correction)
          if (!region || !text || correction.locationUncertain) return []
          const fontSize = aiNoteFont(region)
          const width = noteWidth(text, fontSize)
          const height = fontSize * NOTE_LINE_HEIGHT
          const box = toBox(region)
          // 삽입 첨삭은 메모를 ∨ 바로 위 가운데에 고정해, 표시와 고칠 말이 따로 놀지 않게 한다.
          const fixed =
            correction.edit?.operation === 'INSERT'
              ? {
                  // ∨(폭 = 글자 크기 × 0.75)는 박스 밖에 붙어 있으니, 그 가운데에 메모 가운데를 맞춘다.
                  left:
                    (correction.edit.position === 'AFTER' ? box.right + (fontSize * 0.75) / 2 : box.left - (fontSize * 0.75) / 2) - width / 2,
                  top: box.top - height,
                }
              : undefined
          return [{ key: `ai-${correction.id}`, width, height, region: box, fixed }]
        }),
        serverMarkBoxes,
        size,
      )
    : new Map<string, { left: number; top: number }>()
  const defaultPosition = (item: NoteItem): NotePosition => {
    if (!item.uncertain) {
      const placed = autoPlaced.get(item.key)
      // 배치에 없는 메모(수기 첨삭, 나중에 생긴 첨삭)는 표시 바로 위에 둔다.
      return placed
        ? { x: placed.left / size.width, y: placed.top / size.height }
        : { x: item.region.x, y: item.region.y - (item.fontSize * NOTE_LINE_HEIGHT + NOTE_SPACE) / size.height }
    }
    const left = sideNotes.find((note) => note.key === item.key)?.side === 'left'
    return { x: left ? -(GUTTER - 4) / size.width : (size.width + 8) / size.width, y: (sideTops.get(item.key) ?? 0) / size.height }
  }
  const placedNotes = size.width
    ? items.map((item) => {
        const live = gesture?.type === 'note' && gesture.key === item.key ? { x: gesture.x, y: gesture.y } : null
        // 선은 끌고 있는 만큼 따라가지만 메모는 그대로 둔다.
        const [anchor] = shifted(item.key, [item.region])
        return { ...item, ...(live ?? notePositions[item.key] ?? defaultPosition(item)), anchor }
      })
    : []
  const sideWidth = GUTTER - 12
  // 기본은 모두 진한 색이다. 무언가를 고르면 고른 것만 진하게 두고 나머지는 흐리게 한다.
  const hasSelection = selectedId !== null || selectedCommentId !== null
  const dim = (selected: boolean) => (hasSelection && !selected ? 'opacity-40' : '')
  const gutter = items.some((item) => item.uncertain) ? GUTTER : 0
  // 양옆 메모 여백을 뺀 영역 안에 사진 비율을 지키며 가장 크게 들어가는 상자
  const photoStyle: CSSProperties = {
    width: `min(calc(100cqw - ${gutter * 2}px), calc(100cqh * ${ratio}))`,
    aspectRatio: `${ratio}`,
    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
  }
  const cursor = drawing ? 'cursor-crosshair' : gesture?.type === 'pan' ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : ''

  // 손 모드에서만 표시를 누르고 끌어 옮길 수 있다. 도구를 켜면 영역 고르기를 막지 않게 비켜 둔다.
  const markInteraction = drawing ? 'pointer-events-none' : 'cursor-move touch-none'

  return (
    <div className="flex min-w-px flex-1 flex-col gap-ds-16 rounded-ds-large bg-background-neutral-weak px-ds-24 py-ds-20 font-sans">
      <div className="flex items-center justify-between gap-ds-16">
        <div className="flex h-[36px] min-w-px items-center gap-ds-24 text-label2-medium text-ds-gray-600">
          <p className="flex min-w-px items-center gap-ds-8">
            제목
            <span className="max-w-[200px] truncate text-label2-semibold text-ds-gray-950">{title || '제목 없음'}</span>
          </p>
          {student && (
            <p className="flex shrink-0 items-center gap-ds-8">
              학생
              <span className="text-label2-semibold text-ds-gray-950">{student}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-ds-8">
          <ZoomControl zoom={zoom} onZoomChange={setZoom} />
          <EditorToolbar tool={tool} kind={kind} onChange={onToolChange} />
        </div>
      </div>

      <div className="flex min-h-px flex-1 gap-ds-16">
        <div className="flex shrink-0 flex-col justify-between border-r border-solid border-border-neutral-default pr-ds-16">
          <ol aria-label="학습지 페이지" className="flex flex-col gap-ds-20 overflow-y-auto">
            {pages.map((item, pageIndex) => {
              const selected = item.id === page.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-label={`${pageIndex + 1}쪽 보기`}
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => onPageChange(item.id)}
                    className={`relative block h-[72px] w-[48px] overflow-hidden rounded-ds-small border border-solid bg-background-neutral-default ${
                      selected ? 'border-border-neutral-strong' : 'border-transparent hover:border-border-neutral-default'
                    }`}
                  >
                    {imageUrls[item.id] && <img src={imageUrls[item.id]} alt="" className="absolute inset-0 size-full object-cover" />}
                    <span className="absolute top-ds-4 left-ds-8 text-label3-semibold text-text-neutral-default">{pageIndex + 1}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="text-center text-caption text-ds-gray-950">
            {index + 1}/{pages.length}
          </p>
        </div>

        {/* PDF 저장은 이 영역(사진 + 첨삭 표시 + 옆 여백 메모)을 이미지로 뜬다. 사진이 다 뜨면 data-ready가 true다. */}
        <div
          data-export-photo
          data-ready={photoReady}
          className="flex min-w-px flex-1 items-center justify-center overflow-hidden px-ds-24 [container-type:size]"
        >
          <div
            ref={photoRef}
            className={`relative shrink-0 touch-none ${gesture ? '' : 'transition-transform'} ${cursor}`}
            style={photoStyle}
            onPointerDown={(event) => {
              if (event.button !== 0) return
              if (drawing) {
                event.currentTarget.setPointerCapture(event.pointerId)
                const { x, y } = pointOf(event)
                setGesture({ type: 'draw', x0: x, y0: y, x1: x, y1: y })
              } else if (zoom > 1) {
                event.currentTarget.setPointerCapture(event.pointerId)
                setGesture({ type: 'pan', clientX: event.clientX, clientY: event.clientY, panX, panY })
              }
            }}
            onPointerMove={(event) => {
              if (!gesture) return
              if (gesture.type === 'draw') {
                const { x, y } = pointOf(event)
                setGesture({ ...gesture, x1: x, y1: y })
              } else if (gesture.type === 'pan') {
                setPan({ pageId: page.id, x: gesture.panX + event.clientX - gesture.clientX, y: gesture.panY + event.clientY - gesture.clientY })
              } else if (gesture.type === 'note') {
                // 메모는 사진 옆 여백까지 옮길 수 있다. 화면에 보이는(확대된) 사진 크기로 나눠 0~1 좌표로 바꾼다.
                const rect = photoRef.current!.getBoundingClientRect()
                const moved = gesture.moved || Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > DRAG_THRESHOLD
                const margin = gutter / (size.width || 1)
                setGesture({
                  ...gesture,
                  moved,
                  x: clamp(gesture.x0 + (event.clientX - gesture.clientX) / rect.width, -margin, 1 + margin - 0.05),
                  y: clamp(gesture.y0 + (event.clientY - gesture.clientY) / rect.height, 0, 1 - NOTE_HEIGHT / (size.height || 1)),
                })
              } else {
                const { x, y } = pointOf(event)
                const moved = gesture.moved || Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > DRAG_THRESHOLD
                setGesture({ ...gesture, moved, ...limitShift(regionsOf(gesture.key), x - gesture.x0, y - gesture.y0) })
              }
            }}
            onPointerUp={() => {
              if (gesture?.type === 'draw') {
                // 너무 작게 끈 것은 클릭으로 보고 무시한다. 삽입(∨)은 크기가 고정이라 누르기만 해도 놓는다.
                if (drawRect && (tool === 'CARET' || drawRect.width > 0.01)) onDraw({ pageId: page.id, ...drawRect })
              } else if (gesture?.type === 'move') {
                const isAi = gesture.key.startsWith('ai-')
                const id = Number(gesture.key.slice(gesture.key.indexOf('-') + 1))
                if (!gesture.moved) {
                  if (isAi) onSelect(id)
                  else onSelectComment(id)
                } else {
                  // 메모를 아직 옮긴 적이 없으면 지금 자리에 고정해, 선만 옮겨지게 한다.
                  const note = placedNotes.find((item) => item.key === gesture.key)
                  if (note && !notePositions[gesture.key]) onNoteMove(gesture.key, { x: note.x, y: note.y })
                  const regions = shifted(gesture.key, regionsOf(gesture.key))
                  if (isAi) onMoveCorrection(id, regions)
                  else onMoveComment(id, regions)
                }
              } else if (gesture?.type === 'note') {
                if (gesture.moved) onNoteMove(gesture.key, { x: gesture.x, y: gesture.y })
                else placedNotes.find((item) => item.key === gesture.key)?.select()
              }
              setGesture(null)
            }}
            onPointerCancel={() => setGesture(null)}
          >
            {imageUrls[page.id] ? (
              <img src={imageUrls[page.id]} alt={`${index + 1}쪽 학습지 사진`} draggable={false}
                onLoad={(event) => setLoadedSrc(event.currentTarget.src)} className="absolute inset-0 size-full rounded-ds-small select-none" />
            ) : (
              <div role="status" className="absolute inset-0 grid place-items-center rounded-ds-small bg-background-neutral-subtle text-body2-regular text-text-neutral-muted">
                사진을 불러오고 있어요...
              </div>
            )}

            {/* 사진이 다 뜬 뒤에 첨삭 표시와 메모를 보여준다. */}
            {photoReady && (
              <>
              {corrections.flatMap((correction) => {
                const key = `ai-${correction.id}`
                const selected = correction.id === selectedId
                const tone = correction.feedbackType === 'CORRECTION' ? 'text-text-accent-red' : 'text-text-brand-strong'
                const regions = shifted(key, correction.regions)
                const insertAt = anchorRegion(correction, regions)
                return regions
                  .filter((region) => region.pageId === page.id && (correction.edit?.operation !== 'INSERT' || region === insertAt))
                  .map((region, regionIndex) => (
                    <button
                      key={`${key}-${regionIndex}`}
                      type="button"
                      aria-label={`${areaOf(correction.area).label} ${correction.feedbackType === 'CORRECTION' ? '오류 수정' : '개선 제안'}: ${correction.originalText}`}
                      aria-pressed={selected}
                      tabIndex={drawing ? -1 : undefined}
                      onPointerDown={(event) => {
                        if (!drawing) startMove(event, key)
                      }}
                      // 마우스로 누르기는 사진 틀이 처리하므로 여기서는 키보드(Enter·Space)로 누른 경우만 고른다.
                      onClick={(event) => {
                        if (event.detail === 0) onSelect(correction.id)
                      }}
                      className={`absolute ${tone} ${dim(selected)} ${markInteraction} ${correction.edit?.operation === 'INSERT' ? 'pointer-events-none' : ''}`}
                      style={regionStyle(region)}
                    >
                      {/* 삽입 ∨ 높이는 이 첨삭 메모 글자 크기(박스 높이에서 추측)의 절반이다. */}
                      <Mark
                        shape={aiShape(correction)}
                        thick={selected}
                        dashed={correction.locationUncertain}
                        caretHeight={aiNoteFont(region) / 2}
                        handle={!drawing}
                      />
                    </button>
                  ))
              })}

              {comments.flatMap((comment) => {
                const key = `comment-${comment.id}`
                const selected = comment.id === selectedCommentId
                return shifted(key, comment.regions)
                  .filter((region) => region.pageId === page.id)
                  .map((region, regionIndex) => (
                    <button
                      key={`${key}-${regionIndex}`}
                      type="button"
                      aria-label={`수기 첨삭: ${comment.content}`}
                      aria-pressed={selected}
                      tabIndex={drawing ? -1 : undefined}
                      onPointerDown={(event) => {
                        if (!drawing) startMove(event, key)
                      }}
                      onClick={(event) => {
                        if (event.detail === 0) onSelectComment(comment.id)
                      }}
                      className={`absolute ${toneOf(comment.color)} ${dim(selected)} ${markInteraction}`}
                      style={regionStyle(region)}
                    >
                      <Mark shape={SHAPE_BY_HIGHLIGHT[comment.highlightType]} thick={selected} />
                    </button>
                  ))
              })}

              {/* 위치가 불확실한 첨삭은 메모와 표시를 선으로 잇는다. 사진과 양옆 여백을 덮는 SVG에 px로 그린다. */}
              {placedNotes.some((note) => note.uncertain) && (
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 h-full overflow-visible"
                  style={{ left: -GUTTER, width: size.width + GUTTER * 2 }}
                >
                  {placedNotes
                    .filter((note) => note.uncertain)
                    .map((note) => {
                      const noteLeft = note.x * size.width
                      const toRight = noteLeft + sideWidth / 2 < (note.anchor.x + note.anchor.width / 2) * size.width
                      return (
                        <line
                          key={note.key}
                          x1={GUTTER + (toRight ? noteLeft + sideWidth : noteLeft)}
                          y1={note.y * size.height + NOTE_HEIGHT / 2}
                          x2={GUTTER + (toRight ? note.anchor.x : note.anchor.x + note.anchor.width) * size.width}
                          y2={(note.anchor.y + note.anchor.height / 2) * size.height}
                          stroke="currentColor"
                          strokeWidth={note.selected ? 1.5 : 1}
                          className={`${note.tone} ${dim(note.selected)}`}
                        />
                      )
                    })}
                </svg>
              )}
              {placedNotes.map((note) => (
                <button
                  key={note.key}
                  type="button"
                  title={note.text}
                  tabIndex={-1}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    if (drawing || event.button !== 0) return
                    photoRef.current!.setPointerCapture(event.pointerId)
                    setGesture({ type: 'note', key: note.key, clientX: event.clientX, clientY: event.clientY, x0: note.x, y0: note.y, x: note.x, y: note.y, moved: false })
                  }}
                  // 디자인대로 메모 배경은 흰색 30%(rounded 4px, 좌우 4px)다. 고른 메모는 굵게 한다.
                  className={`absolute flex items-center rounded-[4px] bg-[var(--opacity-white-a30)] px-ds-4 font-medium ${note.tone} ${
                    note.selected ? 'font-semibold' : ''
                  } ${note.uncertain && note.x < 0 ? 'justify-end text-right' : ''} ${dim(note.selected)} ${
                    drawing ? 'pointer-events-none' : 'cursor-move touch-none'
                  }`}
                  style={{
                    left: `${note.x * 100}%`,
                    top: `${note.y * 100}%`,
                    fontSize: note.fontSize,
                    lineHeight: NOTE_LINE_HEIGHT,
                    height: note.uncertain ? NOTE_HEIGHT : note.fontSize * NOTE_LINE_HEIGHT,
                    ...(note.uncertain ? { width: sideWidth } : {}),
                  }}
                >
                  <span className={note.uncertain ? 'truncate' : 'whitespace-nowrap'}>{note.text}</span>
                </button>
              ))}

              {/* 고르고 있거나 골라 둔 영역: 점선 상자와 그 도구 모양으로 미리 보여준다. */}
              {preview && (
                <span aria-hidden="true" className={`pointer-events-none absolute ${toneOf(kind)}`} style={regionStyle(preview.region)}>
                  {/* ∨는 영역 자체가 모양이라 점선 상자를 겹치지 않는다. */}
                  {preview.tool !== 'CARET' && <Mark shape="box" thick={false} dashed />}
                  <Mark shape={SHAPE_BY_HIGHLIGHT[preview.tool]} thick />
                </span>
              )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
