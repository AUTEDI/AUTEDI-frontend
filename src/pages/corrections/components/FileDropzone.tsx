import { useRef, useState, type DragEvent } from 'react'
import uploadIcon from '../../../assets/design-system/upload.svg'

export type FileDropzoneProps = {
  /** 고르거나 끌어다 놓은 파일. 형식·크기 검사는 받는 쪽에서 한다(끌어다 놓기는 accept를 거치지 않는다). */
  onFilesSelected: (files: File[]) => void
  onQrUploadClick: () => void
  className?: string
}

// 서버가 페이지 이미지로 바꿀 수 있는 사진 형식만 고르게 한다.
const ACCEPT = 'image/jpeg,image/png'

/** 학습지 사진을 끌어다 놓거나 눌러서 고르는 업로드 영역 */
export default function FileDropzone({ onFilesSelected, onQrUploadClick, className = '' }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length) onFilesSelected(files)
  }

  return (
    <div
      onClick={openPicker}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        // 안쪽 요소로 옮겨갈 때 생기는 dragleave는 무시한다.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={handleDrop}
      className={`flex size-full cursor-pointer flex-col items-center justify-center gap-ds-48 overflow-clip rounded-ds-large bg-background-brand-weak px-ds-24 py-[36px] font-sans ${
        dragging ? 'outline-2 outline-offset-[-2px] outline-dashed outline-border-focused' : ''
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          // 같은 파일을 다시 골라도 change가 일어나게 비운다.
          event.target.value = ''
          if (files.length) onFilesSelected(files)
        }}
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          openPicker()
        }}
        className="flex flex-col items-center gap-ds-48 rounded-ds-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused"
      >
        <span className="flex size-[64px] items-center justify-center rounded-ds-medium bg-[var(--color-blue-100)]">
          <img src={uploadIcon} alt="" width={48} height={48} />
        </span>
        <span className="flex flex-col items-center gap-ds-8 text-center whitespace-nowrap">
          <span className="text-h3 text-text-neutral-default">사진 또는 파일을 놓아주세요</span>
          <span className="text-body2-regular text-text-neutral-muted">또는 클릭해서 여러 파일을 한 번에 선택하세요</span>
        </span>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onQrUploadClick()
        }}
        className="text-body2-regular text-text-neutral-muted underline"
      >
        QR을 통해 모바일로 업로드
      </button>
    </div>
  )
}
