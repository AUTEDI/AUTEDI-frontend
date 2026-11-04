import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useReviewStore } from '../../stores/useReviewStore'
import type { TeacherComment } from '../../types/review'
import { fitImageSize, placeTeacherNote, pointInRect, selectionFromPoints, type Point, type Size } from '../../utils/annotation'
import { cn } from '../../utils/cn'
import { AiMark } from './AiMark'
import { AiNote } from './AiNote'
import { COMMENT_INPUT_ID, useCanvasRefs } from './canvasRefs'
import { TeacherDraftMark, TeacherMark } from './TeacherMark'
import { TeacherNote } from './TeacherNote'

function DragGuide() {
  const toolMode = useReviewStore((state) => state.toolMode)
  const hidden = useReviewStore((state) => state.guideHidden)

  return (
    <div
      className={cn(
        'pointer-events-none absolute bottom-[13px] left-1/2 -translate-x-1/2 rounded-full bg-[rgba(24,28,54,0.88)] px-3 py-2 text-[7px] whitespace-nowrap text-white transition duration-250',
        hidden && 'translate-y-2 opacity-0',
      )}
    >
      {toolMode === 'annotate' ? '사진 위 문장을 드래그해 선택하세요' : '코멘트는 바로 드래그해 위치를 바꿀 수 있어요'}
    </div>
  )
}

/** 학습지 사진과 그 위의 AI·교사 첨삭 레이어 */
export function CanvasBoard() {
  const { photoRef, boardRef } = useCanvasRefs()
  const worksheetUrl = useReviewStore((state) => state.imageUrl)
  const feedback = useReviewStore((state) => state.feedback)
  const activeFeedbackId = useReviewStore((state) => state.activeFeedbackId)
  const appliedIds = useReviewStore((state) => state.appliedIds)
  const dismissedIds = useReviewStore((state) => state.dismissedIds)
  const teacherComments = useReviewStore((state) => state.teacherComments)
  const selectedTeacherId = useReviewStore((state) => state.selectedTeacherId)
  const toolMode = useReviewStore((state) => state.toolMode)
  const annotationStyle = useReviewStore((state) => state.annotationStyle)
  const annotationColor = useReviewStore((state) => state.annotationColor)
  const draft = useReviewStore((state) => state.draft)
  const zoom = useReviewStore((state) => state.zoom)
  const dragStart = useRef<Point | null>(null)
  const [boardSize, setBoardSize] = useState<Size | null>(null)
  const [loadedImage, setLoadedImage] = useState<{ url: string; size: Size } | null>(null)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)

  // 실제 표시할 이미지의 크기를 사용하고, 주위에는 코멘트용 여백을 남긴다.
  const fittedSize = loadedImage?.url === worksheetUrl && boardSize
    ? fitImageSize(loadedImage.size, { width: boardSize.width * 0.68, height: boardSize.height * 0.94 })
    : null
  const imageReady = fittedSize !== null
  const noteLayout = fittedSize && boardSize ? {
    board: { x: 0, y: 0, ...boardSize },
    photo: {
      x: (boardSize.width - fittedSize.width * zoom) / 2,
      y: (boardSize.height - fittedSize.height * zoom) / 2,
      width: fittedSize.width * zoom,
      height: fittedSize.height * zoom,
    },
    zoom,
  } : null

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(([entry]) => {
      setBoardSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [boardRef])

  // 서버에서 불러온 코멘트는 위치가 없으므로, 화면 크기를 잰 뒤 저장할 때와 같은 규칙으로 배치한다.
  useLayoutEffect(() => {
    const unplaced = teacherComments.filter((comment) => comment.note === null)
    if (!imageReady || !unplaced.length || !photoRef.current || !boardRef.current) return
    const board = boardRef.current.getBoundingClientRect()
    const photo = photoRef.current.getBoundingClientRect()
    const occupiedTops = teacherComments.flatMap((comment) => (comment.note ? [comment.note.top] : []))
    const notes: Record<string, NonNullable<TeacherComment['note']>> = {}
    for (const comment of unplaced) {
      const note = placeTeacherNote({
        board,
        photo,
        selection: { top: photo.top + (comment.box.top / 100) * photo.height },
        occupiedTops,
      })
      notes[comment.id] = note
      occupiedTops.push(note.top)
    }
    useReviewStore.getState().placeTeacherNotes(notes)
  }, [boardRef, photoRef, teacherComments, imageReady])

  const pointerPoint = (event: ReactPointerEvent<HTMLDivElement>) =>
    pointInRect(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect())

  // 표시와 코멘트는 자체 드래그에서 이벤트 전파를 막으므로, 여기에는 빈 사진 영역의 드래그만 들어온다.
  const startDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (toolMode !== 'annotate') return
    event.preventDefault()
    const review = useReviewStore.getState()
    review.showManualEditor()
    dragStart.current = pointerPoint(event)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    review.setDraft(selectionFromPoints(dragStart.current, dragStart.current, annotationStyle))
    review.hideGuide()
  }

  const continueDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    useReviewStore.getState().setDraft(selectionFromPoints(dragStart.current, pointerPoint(event), annotationStyle))
  }

  const finishDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return
    const review = useReviewStore.getState()
    review.setDraft(selectionFromPoints(dragStart.current, pointerPoint(event), annotationStyle))
    dragStart.current = null
    review.finishDraft()
    if (useReviewStore.getState().draftReady) document.getElementById(COMMENT_INPUT_ID)?.focus()
  }

  return (
    <div
      className="relative overflow-hidden bg-[#f7f8fd] bg-[linear-gradient(rgba(106,117,177,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(106,117,177,0.12)_1px,transparent_1px)] bg-size-[22px_22px] max-sm:min-h-[690px] max-sm:overflow-auto"
      ref={boardRef}
    >
      {!imageReady && (
        <p className="absolute inset-0 grid place-items-center text-[10px] text-[#8a8fa0]" role="status">
          {failedImageUrl === worksheetUrl ? '이미지를 불러오지 못했어요.' : '이미지를 불러오고 있어요…'}
        </p>
      )}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 origin-center touch-none bg-white shadow-[0_15px_42px_rgba(31,37,68,0.22)] transition-transform duration-200 select-none',
          toolMode === 'annotate' && 'cursor-crosshair',
        )}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={finishDrawing}
        ref={photoRef}
        style={{
          width: fittedSize?.width ?? 0,
          height: fittedSize?.height ?? 0,
          visibility: imageReady ? 'visible' : 'hidden',
          transform: `translate(-50%, -50%) scale(${zoom})`,
        }}
      >
        <img
          alt="학생이 직접 작성한 영어 학습지 사진"
          className="pointer-events-none block size-full object-contain"
          draggable={false}
          key={worksheetUrl}
          onLoad={(event) => {
            const image = event.currentTarget
            setLoadedImage({ url: worksheetUrl, size: { width: image.naturalWidth, height: image.naturalHeight } })
            setFailedImageUrl(null)
          }}
          onError={() => setFailedImageUrl(worksheetUrl)}
          src={worksheetUrl}
        />
        {/* 위치를 찾지 못한 첨삭은 사진에 그리지 않고 오른쪽 목록에만 보여준다. */}
        {feedback.map(
          (item) =>
            item.mark && (
              <AiMark
                active={item.id === activeFeedbackId}
                applied={appliedIds.includes(item.id)}
                dismissed={dismissedIds.includes(item.id)}
                item={item}
                key={item.id}
                mark={item.mark}
              />
            ),
        )}
        {noteLayout && feedback.map(
          (item) => item.mark && <AiNote dismissed={dismissedIds.includes(item.id)} item={item} key={item.id} layout={noteLayout} />,
        )}
        {teacherComments.map((comment) => (
          <TeacherMark comment={comment} key={comment.id} selected={comment.id === selectedTeacherId} />
        ))}
        {draft && <TeacherDraftMark color={annotationColor} draft={draft} style={annotationStyle} />}
      </div>
      <div aria-live="polite" className="pointer-events-none absolute inset-0">
        {imageReady && teacherComments.map(
          (comment) =>
            comment.note && (
              <TeacherNote
                comment={comment}
                key={comment.id}
                note={comment.note}
                selected={comment.id === selectedTeacherId}
              />
            ),
        )}
      </div>
      {imageReady && <DragGuide />}
    </div>
  )
}
