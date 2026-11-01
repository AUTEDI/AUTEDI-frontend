import { useAppStore } from '../../stores/useAppStore'

export function Topbar() {
  const page = useAppStore((state) => state.page)

  return (
    <header className="sticky top-0 z-[15] flex h-[70px] items-center border-b border-line bg-white/93 px-[38px] shadow-[0_5px_24px_rgba(20,26,63,0.024)] backdrop-blur-[16px] max-sm:hidden">
      <div className="flex items-center gap-[13px] text-[10px] text-[#9a9eae]">
        <span>{page === 'home' ? '홈' : 'AI 첨삭'}</span>
        <i className="size-1 rounded-full bg-[#c3c6d1]" />
        <b className="text-[#4e5368]">{page === 'home' ? '대시보드' : '새 첨삭'}</b>
      </div>
    </header>
  )
}
