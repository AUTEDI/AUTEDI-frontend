import { useEffect, useMemo, useState } from 'react'
import { Arrow, Group, Image as CanvasImage, Layer, Line, Rect, Stage, Text } from 'react-konva'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { FeedbackItem, TeacherComment } from './types'

type ReviewCanvasProps = {
  imageUrl: string
  feedback: FeedbackItem[]
  teacherComments: TeacherComment[]
  activeFeedbackId: string
  drawing: boolean
  zoom: number
  onSelectFeedback: (id: string) => void
  onMoveFeedback: (id: string, x: number, y: number) => void
  onMoveTeacherComment: (id: string, x: number, y: number) => void
  onSelection: (selection: { x: number; y: number; width: number; height: number }) => void
  onDrawingEnd: () => void
}

type Point = { x: number; y: number }

const STAGE_HEIGHT = 646
const NOTE_WIDTH = 224

export function ReviewCanvas({
  imageUrl,
  feedback,
  teacherComments,
  activeFeedbackId,
  drawing,
  zoom,
  onSelectFeedback,
  onMoveFeedback,
  onMoveTeacherComment,
  onSelection,
  onDrawingEnd,
}: ReviewCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [naturalSize, setNaturalSize] = useState({ width: 768, height: 1024 })
  const [dragOrigin, setDragOrigin] = useState<Point | null>(null)
  const [draftBox, setDraftBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    const nextImage = new window.Image()
    nextImage.onload = () => {
      if (!active) return
      setImage(nextImage)
      setNaturalSize({ width: nextImage.naturalWidth, height: nextImage.naturalHeight })
      setLoadError(false)
    }
    nextImage.onerror = () => {
      if (active) {
        setImage(null)
        setLoadError(true)
      }
    }
    nextImage.src = imageUrl
    return () => {
      active = false
    }
  }, [imageUrl])

  const { photoWidth, photoHeight } = useMemo(() => {
    const scale = Math.min(440 / naturalSize.width, 584 / naturalSize.height)
    return {
      photoWidth: Math.max(220, naturalSize.width * scale),
      photoHeight: Math.max(290, naturalSize.height * scale),
    }
  }, [naturalSize])

  const stageWidth = photoWidth + NOTE_WIDTH + 44
  const stageHeight = Math.max(STAGE_HEIGHT, photoHeight)
  const imagePosition = (x: number, y: number) => ({
    x: (x / 100) * photoWidth,
    y: (y / 100) * photoHeight,
  })

  const pointerPosition = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return {
      x: (event.clientX - bounds.left) / zoom,
      y: (event.clientY - bounds.top) / zoom,
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing) return
    const pointer = pointerPosition(event)
    if (pointer.x > photoWidth || pointer.y > photoHeight) return
    const point = {
      x: Math.max(0, Math.min(photoWidth, pointer.x)),
      y: Math.max(0, Math.min(photoHeight, pointer.y)),
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragOrigin(point)
    setDraftBox({ x: point.x, y: point.y, width: 0, height: 0 })
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing || !dragOrigin) return
    const pointer = pointerPosition(event)
    const currentX = Math.max(0, Math.min(photoWidth, pointer.x))
    const currentY = Math.max(0, Math.min(photoHeight, pointer.y))
    setDraftBox({
      x: Math.min(dragOrigin.x, currentX),
      y: Math.min(dragOrigin.y, currentY),
      width: Math.abs(currentX - dragOrigin.x),
      height: Math.abs(currentY - dragOrigin.y),
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawing || !dragOrigin) return
    const pointer = pointerPosition(event)
    const currentX = Math.max(0, Math.min(photoWidth, pointer.x))
    const currentY = Math.max(0, Math.min(photoHeight, pointer.y))
    const box = {
      x: Math.min(dragOrigin.x, currentX),
      y: Math.min(dragOrigin.y, currentY),
      width: Math.abs(currentX - dragOrigin.x),
      height: Math.abs(currentY - dragOrigin.y),
    }
    setDragOrigin(null)
    setDraftBox(null)
    onDrawingEnd()
    if (box.width < 18 || box.height < 8) return
    onSelection({
      x: (box.x / photoWidth) * 100,
      y: (box.y / photoHeight) * 100,
      width: (box.width / photoWidth) * 100,
      height: (box.height / photoHeight) * 100,
    })
  }

  const fitStageWidth = stageWidth * zoom
  const fitStageHeight = stageHeight * zoom

  return (
    <div
      className={`review-canvas-wrap${drawing ? ' is-drawing' : ''}`}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ height: fitStageHeight, width: fitStageWidth }}
    >
      {loadError ? (
        <div className="canvas-error">이미지를 표시할 수 없어요. 다른 이미지로 다시 시도해주세요.</div>
      ) : (
        <Stage
          height={stageHeight}
          scaleX={zoom}
          scaleY={zoom}
          width={stageWidth}
        >
          <Layer>
            <Rect
              fill="#fff"
              height={photoHeight}
              shadowBlur={18}
              shadowColor="#1c2144"
              shadowOpacity={0.14}
              width={photoWidth}
              x={0}
              y={0}
            />
            {image && <CanvasImage height={photoHeight} image={image} width={photoWidth} x={0} y={0} />}
            {feedback.map((item) => {
              const { x, y } = imagePosition(item.x, item.y)
              const width = (item.width / 100) * photoWidth
              const height = Math.max(20, (item.height / 100) * photoHeight)
              const color = item.kind === 'correction' ? '#e34e63' : '#4c65e8'
              const noteX = photoWidth + 20
              const noteY = Math.min(stageHeight - 80, Math.max(8, (item.noteY / 100) * photoHeight))
              const active = item.id === activeFeedbackId

              return (
                <Group key={item.id}>
                  <Line
                    listening={false}
                    opacity={0.72}
                    points={[x + width, y + height / 2, noteX - 10, noteY + 28]}
                    stroke={color}
                    strokeWidth={active ? 2 : 1}
                  />
                  <Rect
                    cornerRadius={item.kind === 'correction' ? 12 : 4}
                    dash={item.kind === 'improvement' ? [5, 4] : undefined}
                    draggable={!drawing}
                    fill={active ? `${color}18` : `${color}0a`}
                    height={height}
                    onClick={() => onSelectFeedback(item.id)}
                    onDragEnd={(event) =>
                      onMoveFeedback(
                        item.id,
                        Math.max(0, Math.min(100 - item.width, (event.target.x() / photoWidth) * 100)),
                        Math.max(0, Math.min(100 - item.height, (event.target.y() / photoHeight) * 100)),
                      )
                    }
                    onTap={() => onSelectFeedback(item.id)}
                    shadowBlur={active ? 8 : 0}
                    shadowColor={color}
                    stroke={color}
                    strokeWidth={active ? 2.4 : 1.5}
                    width={width}
                    x={x}
                    y={y}
                  />
                  <Rect
                    cornerRadius={11}
                    fill={active ? '#fff' : '#ffffffef'}
                    height={57}
                    onClick={() => onSelectFeedback(item.id)}
                    onTap={() => onSelectFeedback(item.id)}
                    shadowBlur={9}
                    shadowColor="#212646"
                    shadowOpacity={0.12}
                    width={NOTE_WIDTH}
                    x={noteX}
                    y={noteY}
                  />
                  <Rect
                    cornerRadius={3}
                    fill={color}
                    height={32}
                    width={4}
                    x={noteX + 10}
                    y={noteY + 12}
                  />
                  <Text
                    ellipsis
                    fontFamily="Inter, Pretendard, sans-serif"
                    fontSize={12}
                    fontStyle="bold"
                    listening={false}
                    onClick={() => onSelectFeedback(item.id)}
                    onTap={() => onSelectFeedback(item.id)}
                    text={item.suggestion}
                    width={NOTE_WIDTH - 26}
                    x={noteX + 22}
                    y={noteY + 11}
                  />
                  <Text
                    fill="#777b91"
                    fontFamily="Inter, Pretendard, sans-serif"
                    fontSize={9}
                    listening={false}
                    text={item.kind === 'correction' ? '오류 수정' : '개선 제안'}
                    width={NOTE_WIDTH - 26}
                    x={noteX + 22}
                    y={noteY + 33}
                  />
                </Group>
              )
            })}
            {teacherComments.map((comment) => {
              const { x, y } = imagePosition(comment.x, comment.y)
              const width = (comment.width / 100) * photoWidth
              const height = Math.max(16, (comment.height / 100) * photoHeight)
              const color = comment.color === 'red' ? '#e34e63' : '#4365e8'
              const onDragEnd = (event: KonvaEventObject<DragEvent>) =>
                onMoveTeacherComment(
                  comment.id,
                  Math.max(0, Math.min(100 - comment.width, (event.target.x() / photoWidth) * 100)),
                  Math.max(0, Math.min(100 - comment.height, (event.target.y() / photoHeight) * 100)),
                )

              return (
                <Group
                  draggable
                  key={comment.id}
                  onDragEnd={onDragEnd}
                  x={x}
                  y={y}
                >
                  {comment.style === 'underline' && (
                    <Line points={[0, height, width, height]} stroke={color} strokeWidth={3} />
                  )}
                  {comment.style === 'arrow' && (
                    <Arrow
                      points={[0, height / 2, width, height / 2]}
                      pointerLength={9}
                      pointerWidth={8}
                      stroke={color}
                      strokeWidth={2}
                    />
                  )}
                  {comment.style === 'caret' && (
                    <Line
                      points={[0, height, width / 2, 0, width, height]}
                      stroke={color}
                      strokeWidth={2.5}
                    />
                  )}
                  {(comment.style === 'highlight' || comment.style === 'box') && (
                    <Rect
                      cornerRadius={comment.style === 'highlight' ? 8 : 2}
                      fill={comment.style === 'highlight' ? `${color}18` : 'transparent'}
                      height={height}
                      stroke={color}
                      strokeWidth={2}
                      width={width}
                    />
                  )}
                </Group>
              )
            })}
            {draftBox && (
              <Rect
                dash={[6, 4]}
                fill="#5867e829"
                height={draftBox.height}
                listening={false}
                stroke="#5867e8"
                strokeWidth={2}
                width={draftBox.width}
                x={draftBox.x}
                y={draftBox.y}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  )
}
