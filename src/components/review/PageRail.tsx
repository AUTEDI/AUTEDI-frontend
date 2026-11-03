import { useAppStore } from '../../stores/useAppStore'
import { useReviewStore } from '../../stores/useReviewStore'
import { cn } from '../../utils/cn'

export function PageRail({ onSelect }: { onSelect: (uploadId: string) => void }) {
  const uploads = useAppStore((state) => state.uploads)
  const activeUploadId = useReviewStore((state) => state.activeUploadId)
  const pendingMutations = useReviewStore((state) => state.pendingMutations)

  return (
    <aside aria-label="업로드한 학습지 목록" className="flex min-h-0 flex-col items-center gap-3 overflow-y-auto border-r border-line bg-[#fbfcff] px-3 py-[17px] max-sm:flex-row max-sm:overflow-x-auto max-sm:border-r-0 max-sm:border-b max-sm:py-3">
      <span className="shrink-0 text-[8px] font-extrabold text-[#6b7184]">원본 {uploads.length}</span>
      {uploads.map((upload, index) => (
        <button
          aria-current={upload.id === activeUploadId ? 'page' : undefined}
          aria-label={`${index + 1}번 파일: ${upload.name}`}
          className={cn(
            'w-[61px] shrink-0 rounded-[7px] border-[1.5px] bg-white p-1 transition focus-visible:outline-2 focus-visible:outline-[#6c7be7] disabled:cursor-wait disabled:opacity-50',
            upload.id === activeUploadId
              ? 'border-[#6c7be7] shadow-[0_4px_12px_rgba(66,78,166,0.1)]'
              : 'border-[#e1e4ee] hover:border-[#6c7be7]',
          )}
          disabled={pendingMutations > 0}
          key={upload.id}
          onClick={() => onSelect(upload.id)}
          title={pendingMutations ? '저장이 끝나면 파일을 전환할 수 있어요' : upload.name}
          type="button"
        >
          <img alt={upload.name} className="block h-[73px] w-full rounded-[3px] bg-white object-contain" src={upload.worksheet.imageUrl} />
          <b className="mt-1.5 block text-[7px] text-[#61677d]">{index + 1}</b>
          <span className="mt-1 block truncate text-[7px] text-[#858a9c]">{upload.name}</span>
        </button>
      ))}
    </aside>
  )
}
