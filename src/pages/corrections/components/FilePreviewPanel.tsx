import { useRef, useState } from 'react'
import closeSelectedIcon from '../../../assets/design-system/thumbnail-close-selected.svg'
import closeIcon from '../../../assets/design-system/thumbnail-close.svg'
import PhotoViewer from './PhotoViewer'

export type PreviewPage = { id: string; name: string; url: string }

export type FilePreviewPanelProps = {
  pages: readonly PreviewPage[]
  onAddFiles: (files: File[]) => void
  onRemove: (id: string) => void
  onClear: () => void
  className?: string
}

const smallButton =
  'rounded-ds-small border border-solid border-border-weak bg-background-neutral-default px-ds-12 py-ds-8 text-label3-medium whitespace-nowrap text-text-neutral-default'

/** 파일 확인 단계: 왼쪽 쪽 목록과 가운데 사진 보기 */
export default function FilePreviewPanel({ pages, onAddFiles, onRemove, onClear, className = '' }: FilePreviewPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedId, setSelectedId] = useState(pages[0]?.id)
  // 지운 쪽을 보고 있었다면 첫 쪽을 보여준다.
  const index = Math.max(0, pages.findIndex((page) => page.id === selectedId))
  const current = pages[index]

  return (
    <div className={`flex gap-ds-24 rounded-ds-large bg-background-neutral-weak p-ds-24 font-sans ${className}`}>
      <div className="flex w-[88px] shrink-0 flex-col justify-between border-r border-solid border-border-default pr-ds-16">
        <div className="flex min-h-0 flex-col items-center gap-ds-24 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="text-caption text-text-neutral-default">
            {index + 1}/{pages.length}
          </p>
          <ol aria-label="올린 사진" className="flex w-full shrink-0 flex-col gap-ds-24">
            {pages.map((page, pageIndex) => {
              const selected = page === current
              return (
                <li key={page.id} className="relative aspect-[72/108] w-full shrink-0">
                  <button
                    type="button"
                    aria-label={`${pageIndex + 1}번 사진 보기`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => setSelectedId(page.id)}
                    className={`block size-full overflow-hidden rounded-ds-small border border-solid ${selected ? 'border-action-primary' : 'border-border-default'}`}
                  >
                    <img src={page.url} alt="" className="block size-full object-cover" />
                  </button>
                  <span
                    className={`pointer-events-none absolute top-ds-4 left-ds-8 text-label3-semibold ${selected ? 'text-text-neutral-default' : 'text-text-neutral-muted'}`}
                  >
                    {pageIndex + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={`${pageIndex + 1}번 사진 삭제`}
                    onClick={() => onRemove(page.id)}
                    className="absolute top-ds-4 right-ds-4 flex size-[16px] items-center justify-center"
                  >
                    <img src={selected ? closeSelectedIcon : closeIcon} alt="" width={7.75} height={7.75} />
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
        <div className="flex flex-col items-start gap-ds-8 pt-ds-8">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            hidden
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              event.target.value = ''
              if (files.length) onAddFiles(files)
            }}
          />
          <button type="button" onClick={() => inputRef.current?.click()} className={smallButton}>
            파일 추가
          </button>
          <button type="button" onClick={onClear} className={smallButton}>
            전체 삭제
          </button>
        </div>
      </div>

      {current && (
        <PhotoViewer
          key={current.id}
          src={current.url}
          alt={`${index + 1}번 사진: ${current.name}`}
          onPrev={index > 0 ? () => setSelectedId(pages[index - 1].id) : undefined}
          onNext={index < pages.length - 1 ? () => setSelectedId(pages[index + 1].id) : undefined}
        />
      )}
    </div>
  )
}
