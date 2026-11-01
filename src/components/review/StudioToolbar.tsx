import { Fragment } from 'react'
import { useReviewStore } from '../../stores/useReviewStore'
import { cn } from '../../utils/cn'
import { ANNOTATION_STYLES } from './annotationStyles'

const TOOL = 'size-7 rounded-[7px] text-[9px]'
const DIVIDER = <i className="mx-[5px] h-5 w-px bg-[#e2e4eb]" />

export function StudioToolbar() {
  const toolMode = useReviewStore((state) => state.toolMode)
  const annotationStyle = useReviewStore((state) => state.annotationStyle)
  const zoom = useReviewStore((state) => state.zoom)
  const panelOpen = useReviewStore((state) => state.panelOpen)
  const zoomBy = useReviewStore((state) => state.zoomBy)
  const beginAnnotation = useReviewStore((state) => state.beginAnnotation)
  const startNewTeacherComment = useReviewStore((state) => state.startNewTeacherComment)
  const showAiList = useReviewStore((state) => state.showAiList)
  const annotating = toolMode === 'annotate'

  return (
    <div className="flex items-center justify-between border-b border-line bg-[#fbfbff] px-[14px]">
      <div className="flex items-center gap-[5px]">
        <button
          aria-label="교사 코멘트 추가"
          aria-pressed={annotating}
          className={cn(TOOL, annotating ? 'bg-[#e9ebff] text-[#4254d4]' : 'bg-[#f2f3f7] text-[#74798d]')}
          onClick={startNewTeacherComment}
          type="button"
        >
          T+
        </button>
        {DIVIDER}
        <button
          aria-label="축소"
          className={cn(TOOL, 'bg-[#f2f3f7] text-[#74798d]')}
          onClick={() => zoomBy(-0.1)}
          type="button"
        >
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          aria-label="확대"
          className={cn(TOOL, 'bg-[#f2f3f7] text-[#74798d]')}
          onClick={() => zoomBy(0.1)}
          type="button"
        >
          ＋
        </button>
        {ANNOTATION_STYLES.map((style) => (
          <Fragment key={style.id}>
            {/* 강조 표시(하이라이트·밑줄) 앞과 기호 표시(화살표 등) 앞에 구분선을 둔다. */}
            {(style.id === 'highlight' || style.id === 'arrow') && DIVIDER}
            <button
              aria-label={style.toolbarLabel}
              aria-pressed={annotationStyle === style.id}
              className={cn(
                TOOL,
                'font-extrabold text-[#5061d7]',
                ['arrow', 'box', 'caret'].includes(style.id) && 'text-[16px] leading-none',
                annotationStyle === style.id ? 'bg-[#e9ebff] shadow-[inset_0_-2px_#5264dc]' : 'bg-[#f2f3f7]',
              )}
              onClick={() => beginAnnotation(style.id)}
              title={style.name}
              type="button"
            >
              {style.icon}
            </button>
          </Fragment>
        ))}
      </div>
      <div className="flex items-center gap-[5px]">
        <span className="text-[7px] text-[#9a9ead] max-sm:hidden">코멘트는 바로 드래그해 이동</span>
        {!panelOpen && (
          <button
            className="h-7 rounded-lg bg-primary-gradient px-[10px] text-[7px] font-extrabold text-white shadow-[0_7px_16px_rgba(60,76,203,0.2)] max-sm:px-[7px] max-sm:shadow-none"
            onClick={showAiList}
            type="button"
          >
            피드백 패널 열기
          </button>
        )}
      </div>
    </div>
  )
}
