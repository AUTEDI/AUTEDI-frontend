import zoomInIcon from '../../../assets/design-system/icon-zoom-in.svg'
import zoomOutIcon from '../../../assets/design-system/icon-zoom-out.svg'

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

export type ZoomControlProps = {
  /** 1이 100% */
  zoom: number
  onZoomChange: (zoom: number) => void
}

/** 사진 축소·확대 버튼과 현재 배율 */
export default function ZoomControl({ zoom, onZoomChange }: ZoomControlProps) {
  const change = (delta: number) => onZoomChange(Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta)) * 10) / 10)

  return (
    <div className="flex items-center gap-ds-8 rounded-ds-small border border-solid border-border-weak bg-background-neutral-default px-ds-12 py-ds-8">
      <button type="button" aria-label="축소" disabled={zoom <= ZOOM_MIN} onClick={() => change(-ZOOM_STEP)} className="flex size-ds-16 items-center justify-center disabled:opacity-40">
        <img src={zoomOutIcon} alt="" width={13.25} height={1.25} />
      </button>
      <span className="min-w-[32px] pl-ds-4 text-center text-label3-medium text-text-neutral-default">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="확대" disabled={zoom >= ZOOM_MAX} onClick={() => change(ZOOM_STEP)} className="flex size-ds-16 items-center justify-center disabled:opacity-40">
        <img src={zoomInIcon} alt="" width={11.25} height={11.25} />
      </button>
    </div>
  )
}
