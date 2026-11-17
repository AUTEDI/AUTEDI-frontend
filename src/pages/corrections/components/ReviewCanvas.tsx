import { useState, type CSSProperties } from 'react'
import type { Correction, ReviewPage } from '../../../apis/review'
import { areaOf } from './correctionAreas'
import ZoomControl from './ZoomControl'

export type ReviewCanvasProps = {
  title: string
  pages: readonly ReviewPage[]
  /** 페이지 ID별 이미지 주소. 아직 받는 중이면 없다. */
  imageUrls: Readonly<Record<number, string>>
  pageId: number
  onPageChange: (pageId: number) => void
  corrections: readonly Correction[]
  selectedId: number | null
  onSelect: (correctionId: number) => void
}

/**
 * 원문 위 표시 하나. 삭제는 취소선, 삽입은 앞·뒤 끝의 ∧, 나머지는 밑줄로 그린다.
 * 위치를 확신하지 못한 첨삭은 점선으로 그린다.
 */
function Stroke({ correction, selected }: { correction: Correction; selected: boolean }) {
  const operation = correction.edit?.operation
  const line = `border-current ${selected ? 'border-b-3' : 'border-b-2'} ${correction.locationUncertain ? 'border-dashed' : ''}`
  if (operation === 'DELETE') return <span className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${line}`} />
  if (operation === 'INSERT') {
    const after = correction.edit?.position === 'AFTER'
    return (
      <span
        className={`absolute -bottom-[6px] h-[8px] w-[12px] bg-current [clip-path:polygon(50%_0,100%_100%,80%_100%,50%_35%,20%_100%,0_100%)] ${
          after ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'
        }`}
      />
    )
  }
  return <span className={`absolute inset-x-0 bottom-0 ${line}`} />
}

/** 첨삭 검토 왼쪽: 페이지 목록과 첨삭 표시가 올라간 학습지 사진 */
export default function ReviewCanvas({ title, pages, imageUrls, pageId, onPageChange, corrections, selectedId, onSelect }: ReviewCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const index = Math.max(0, pages.findIndex((page) => page.id === pageId))
  const page = pages[index]
  const ratio = page.width / page.height
  // 영역(100cqw × 100cqh) 안에 사진 비율을 지키며 가장 크게 들어가는 상자
  const photoStyle: CSSProperties = { width: `min(100cqw, calc(100cqh * ${ratio}))`, aspectRatio: `${ratio}`, transform: `scale(${zoom})` }

  return (
    <div className="flex min-w-px flex-1 flex-col gap-ds-16 rounded-ds-large bg-background-neutral-weak px-ds-24 py-ds-20 font-sans">
      <div className="flex items-center justify-between gap-ds-16">
        <p className="flex h-[36px] min-w-px items-center gap-ds-8 text-label2-medium text-ds-gray-600">
          제목
          <span className="max-w-[240px] truncate text-label2-semibold text-ds-gray-950">{title || '제목 없음'}</span>
          {/* shortcut: 학습지에 학생 정보가 없어 학생 이름은 빼 둔다, 학생 API가 생기면 제목 옆에 붙인다. */}
        </p>
        {/* shortcut: 표시 도구(밑줄·취소선·화살표·삽입)는 수기 첨삭 작업 때 이 옆에 붙인다. */}
        <ZoomControl zoom={zoom} onZoomChange={setZoom} />
      </div>

      <div className="flex min-h-px flex-1 gap-ds-16">
        <div className="flex shrink-0 flex-col justify-between border-r border-solid border-border-default pr-ds-16">
          <ol aria-label="학습지 페이지" className="flex flex-col gap-ds-20 overflow-y-auto [scrollbar-width:none]">
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
                      selected ? 'border-border-strong' : 'border-transparent'
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

        <div className="flex min-w-px flex-1 items-center justify-center overflow-hidden px-ds-24 [container-type:size]">
          <div className="relative shrink-0 transition-transform" style={photoStyle}>
            {imageUrls[page.id] ? (
              <img src={imageUrls[page.id]} alt={`${index + 1}쪽 학습지 사진`} draggable={false} className="absolute inset-0 size-full rounded-ds-small" />
            ) : (
              <div role="status" className="absolute inset-0 grid place-items-center rounded-ds-small bg-background-neutral-subtle text-body2-regular text-text-neutral-muted">
                사진을 불러오고 있어요...
              </div>
            )}
            {corrections.flatMap((correction) => {
              const regions = correction.regions.filter((region) => region.pageId === page.id)
              const selected = correction.id === selectedId
              const tone = correction.feedbackType === 'CORRECTION' ? 'text-text-accent-red' : 'text-text-brand-strong'
              // 바꿀 말이 있으면(교체·삽입) 첫 줄 위에 적는다. 삭제는 취소선만 긋는다.
              const label = correction.edit?.operation === 'DELETE' ? '' : correction.edit?.text || correction.content
              return regions.map((region, regionIndex) => (
                <button
                  key={`${correction.id}-${regionIndex}`}
                  type="button"
                  aria-label={`${areaOf(correction.area).label} ${correction.feedbackType === 'CORRECTION' ? '오류 수정' : '개선 제안'}: ${correction.originalText}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(correction.id)}
                  className={`absolute ${tone} ${correction.isApplied && !selected ? 'opacity-40' : ''}`}
                  style={{
                    left: `${region.x * 100}%`,
                    top: `${region.y * 100}%`,
                    width: `${region.width * 100}%`,
                    height: `${region.height * 100}%`,
                  }}
                >
                  <Stroke correction={correction} selected={selected} />
                  {regionIndex === 0 && label && (
                    <span className="absolute bottom-full left-0 mb-[2px] rounded-[4px] bg-[var(--opacity-white-a30)] px-ds-4 text-label3-medium whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </button>
              ))
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
