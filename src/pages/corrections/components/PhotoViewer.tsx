import { useState, type CSSProperties } from 'react'
import chevronIcon from '../../../assets/design-system/icon-chevron-down.svg'
import flipIcon from '../../../assets/design-system/icon-flip.svg'
import rotateIcon from '../../../assets/design-system/icon-rotate.svg'
import zoomInIcon from '../../../assets/design-system/icon-zoom-in.svg'
import zoomOutIcon from '../../../assets/design-system/icon-zoom-out.svg'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

export type PhotoViewerProps = {
  src: string
  alt: string
  onPrev?: () => void
  onNext?: () => void
}

/**
 * 사진 한 장을 보여주는 영역. 사진은 원본 비율을 지키며 영역 안에 가장 크게 들어가고
 * (가로나 세로 한쪽이 영역에 딱 맞음), 확대·회전·좌우 반전을 할 수 있다.
 * 사진을 바꿀 때는 key로 다시 마운트해 보기 상태를 초기화한다.
 */
export default function PhotoViewer({ src, alt, onPrev, onNext }: PhotoViewerProps) {
  const [ratio, setRatio] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const sideways = rotation % 180 !== 0
  // 돌린 뒤 화면에 보이는 가로/세로 비율
  const shownRatio = ratio === null ? 1 : sideways ? 1 / ratio : ratio

  // 영역 크기(100cqw × 100cqh) 안에 비율을 지키며 가장 크게 들어가는 상자
  const frameStyle: CSSProperties = {
    width: `min(100cqw, calc(100cqh * ${shownRatio}))`,
    aspectRatio: `${shownRatio}`,
    transform: `scale(${zoom})`,
    visibility: ratio === null ? 'hidden' : 'visible',
  }
  // 옆으로 돌리면 사진 자체는 상자의 가로·세로를 바꾼 크기로 그린 뒤 회전한다.
  const imageStyle: CSSProperties = {
    width: sideways ? `${100 / shownRatio}%` : '100%',
    height: sideways ? `${100 * shownRatio}%` : '100%',
    transform: `translate(-50%, -50%) rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
  }

  const changeZoom = (delta: number) => setZoom((value) => Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value + delta)) * 10) / 10)
  const arrow = 'flex h-[43px] w-[29px] items-center justify-center rounded-ds-small bg-background-neutral-subtle disabled:invisible'
  const control = 'flex items-center rounded-ds-small border border-solid border-border-weak bg-background-neutral-default'

  return (
    <div className="flex min-w-px flex-1 flex-col justify-between">
      <div className="flex min-h-px flex-1 items-center py-ds-24">
        <div className="shrink-0 pr-ds-24">
          <button type="button" aria-label="이전 사진" disabled={!onPrev} onClick={onPrev} className={arrow}>
            <img src={chevronIcon} alt="" width={11.75} height={6.5} className="rotate-90" />
          </button>
        </div>
        <div className="flex h-full min-w-px flex-1 items-center justify-center overflow-hidden [container-type:size]">
          <div className="relative shrink-0 transition-transform" style={frameStyle}>
            <img
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(event) => setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
              className="absolute top-1/2 left-1/2 max-w-none rounded-ds-small object-fill"
              style={imageStyle}
            />
          </div>
        </div>
        <div className="shrink-0 pl-ds-24">
          <button type="button" aria-label="다음 사진" disabled={!onNext} onClick={onNext} className={arrow}>
            <img src={chevronIcon} alt="" width={11.75} height={6.5} className="-rotate-90" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-ds-8">
        <div className={`${control} gap-ds-8 px-ds-12 py-ds-8`}>
          <button type="button" aria-label="축소" disabled={zoom <= ZOOM_MIN} onClick={() => changeZoom(-ZOOM_STEP)} className="flex size-ds-16 items-center justify-center disabled:opacity-40">
            <img src={zoomOutIcon} alt="" width={13.25} height={1.25} />
          </button>
          <span className="min-w-[32px] pl-ds-4 text-center text-label3-medium text-text-neutral-default">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="확대" disabled={zoom >= ZOOM_MAX} onClick={() => changeZoom(ZOOM_STEP)} className="flex size-ds-16 items-center justify-center disabled:opacity-40">
            <img src={zoomInIcon} alt="" width={11.25} height={11.25} />
          </button>
        </div>
        <div className={`${control} h-[34px]`}>
          <button type="button" aria-label="오른쪽으로 90도 회전" onClick={() => setRotation((value) => (value + 90) % 360)} className="flex h-full items-center px-ds-12">
            <img src={rotateIcon} alt="" width={16} height={16} />
          </button>
          <span aria-hidden="true" className="h-[14px] border-l border-border-weak" />
          <button type="button" aria-label="좌우 반전" aria-pressed={flipped} onClick={() => setFlipped((value) => !value)} className="flex h-full items-center px-ds-12">
            <img src={flipIcon} alt="" width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
