import { useId, useRef } from 'react'
import type { UploadedFile } from '../../stores/useAppStore'
import { Button } from '../common/Button'

type UploadPreviewProps = {
  uploads: UploadedFile[]
  activeUploadId: string | null
  uploading: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onFiles: (files: File[]) => void
}

export function UploadPreview({ uploads, activeUploadId, uploading, onSelect, onRemove, onFiles }: UploadPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const index = uploads.findIndex((file) => file.id === activeUploadId)
  const active = uploads[index]
  if (!active) return null

  const move = (direction: number) => {
    const next = uploads[index + direction]
    if (next) onSelect(next.id)
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[12px] font-extrabold text-[#555d79]">업로드한 파일 <span className="ml-1 text-[#5968df]">{uploads.length}</span></h2>
        <Button disabled={uploading} onClick={() => inputRef.current?.click()} size="xs" className="disabled:opacity-50">
          {uploading ? '파일 올리는 중…' : '+ 파일 추가'}
        </Button>
        <input
          ref={inputRef}
          aria-label="미리보기에 파일 추가"
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={uploading}
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            if (files.length) onFiles(files)
            event.target.value = ''
          }}
          type="file"
        />
      </div>
      <div
        aria-label="업로드한 파일 미리보기"
        aria-describedby={titleId}
        aria-roledescription="캐러셀"
        className="relative min-w-0 rounded-[15px] bg-[#f6f7fb] focus-visible:outline-2 focus-visible:outline-[#6976e8]"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault()
            move(event.key === 'ArrowLeft' ? -1 : 1)
          }
        }}
        role="region"
        tabIndex={0}
      >
        <div className="overflow-hidden rounded-[15px]">
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {uploads.map((file, slideIndex) => (
              <div
                aria-hidden={slideIndex !== index}
                aria-label={`${slideIndex + 1} / ${uploads.length}`}
                aria-roledescription="슬라이드"
                className="h-[380px] w-full shrink-0 px-14 py-4 max-sm:h-[300px] max-sm:px-11"
                key={file.id}
                role="group"
              >
                <img alt={file.name} className="size-full object-contain" draggable={false} src={file.worksheet.imageUrl} />
              </div>
            ))}
          </div>
        </div>
        <button
          aria-label="이전 파일"
          className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-[#e0e3ef] bg-white text-[#5968df] shadow-sm transition hover:bg-[#eef0ff] focus-visible:outline-2 focus-visible:outline-[#6976e8] disabled:cursor-default disabled:opacity-30"
          disabled={index === 0}
          onClick={() => move(-1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m14 6-6 6 6 6" /></svg>
        </button>
        <button
          aria-label="다음 파일"
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-[#e0e3ef] bg-white text-[#5968df] shadow-sm transition hover:bg-[#eef0ff] focus-visible:outline-2 focus-visible:outline-[#6976e8] disabled:cursor-default disabled:opacity-30"
          disabled={index === uploads.length - 1}
          onClick={() => move(1)}
          type="button"
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="m10 6 6 6-6 6" /></svg>
        </button>
      </div>
      <div aria-live="polite" aria-atomic="true" className="relative min-w-0 px-10 text-center">
        <h3 className="text-[13px] font-extrabold break-all text-[#343b56]" id={titleId}>{active.name}</h3>
        <p className="mt-1 text-[9px] text-[#8a8fa0]">{active.meta}</p>
        <p className="mt-2 text-[10px] font-bold text-[#5968df]">{index + 1} / {uploads.length}</p>
        <button
          aria-label={`${active.name} 파일 삭제`}
          className="absolute top-0 right-0 grid size-8 place-items-center rounded-full bg-[#f1f2f7] text-[18px] text-[#767b8d] hover:bg-[#ffe9ed] hover:text-[#c53843] disabled:opacity-30"
          disabled={uploading}
          onClick={() => onRemove(active.id)}
          type="button"
        >×</button>
      </div>
    </div>
  )
}
