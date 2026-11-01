import { useReviewStore } from '../../stores/useReviewStore'

export function PageRail() {
  const worksheetUrl = useReviewStore((state) => state.imageUrl)

  return (
    <aside className="flex flex-col items-center border-r border-line bg-[#fbfcff] px-3 py-[17px] max-sm:hidden">
      <span className="mb-[14px] text-[8px] font-extrabold text-[#6b7184]">원본</span>
      <button
        aria-current="page"
        className="w-[61px] rounded-[7px] border-[1.5px] border-[#6c7be7] bg-white p-1 shadow-[0_4px_12px_rgba(66,78,166,0.1)]"
        type="button"
      >
        <img alt="1페이지 미리보기" className="block h-[73px] w-full rounded-[3px] bg-white object-contain" src={worksheetUrl} />
        <b className="mt-1.5 block text-[7px] text-[#61677d]">1</b>
      </button>
    </aside>
  )
}
