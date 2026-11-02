import { useState, type DragEvent } from 'react'
import { cn } from '../../utils/cn'
import { UploadIcon } from '../layout/icons'

const INPUT_ID = 'worksheet-file-input'

export function Dropzone({ onFiles, uploading }: { onFiles: (files: File[]) => void; uploading: boolean }) {
  const [dragging, setDragging] = useState(false)

  const stopDrag = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
  }

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center rounded-[15px] border-[1.5px] border-dashed text-center transition duration-200 hover:border-[#6976e8] hover:bg-[#eef0ff]',
        dragging ? 'border-[#6976e8] bg-[#eef0ff]' : 'border-[#bfc5ec] bg-[linear-gradient(145deg,#fbfbff,#f1f3ff)]',
      )}
      htmlFor={INPUT_ID}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={stopDrag}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDrop={(event) => {
        stopDrag(event)
        const files = Array.from(event.dataTransfer.files)
        if (files.length && !uploading) onFiles(files)
      }}
    >
      <input
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        disabled={uploading}
        id={INPUT_ID}
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length) onFiles(files)
          // 같은 파일을 다시 골라도 change가 일어나도록 비운다.
          event.target.value = ''
        }}
        type="file"
      />
      <div className="mb-[17px] grid size-[58px] place-items-center rounded-[18px] bg-white shadow-[0_12px_30px_rgba(52,65,152,0.12)]">
        <UploadIcon className="size-[25px] fill-none stroke-[#5d6de4] stroke-[1.7]" />
      </div>
      <h2 className="mb-1.5 text-[16px]">{uploading ? '학습지를 올리고 있어요…' : '사진 또는 파일을 놓아주세요'}</h2>
      <p className="mb-3 text-[9px] text-[#8a8fa0]">
        {uploading ? '잠시만 기다려주세요' : '또는 클릭해서 여러 파일을 한 번에 선택하세요'}
      </p>
      <small className="text-[7px] font-extrabold tracking-[1px] text-[#a0a4b3]">JPG · PNG · PDF</small>
    </label>
  )
}
