type RecentWorkProps = {
  onShowHistory: () => void
  onStart: () => void
}

export function RecentWork({ onShowHistory, onStart }: RecentWorkProps) {
  return (
    <>
      <div className="mt-[37px] flex items-end justify-between">
        <h2 className="mt-[7px] text-[19px]">최근 작업</h2>
        <button className="text-[9px] text-[#8c91a1]" onClick={onShowHistory} type="button">
          전체 보기 <span>→</span>
        </button>
      </div>
      <div className="mt-[13px] flex items-center gap-[13px] rounded-2xl border border-dashed border-[#dadde8] bg-white p-[22px] max-sm:items-start">
        <span className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-[#eeeefe] text-[#5a68dc]">✎</span>
        <div className="grid gap-1">
          <b className="text-[10px]">아직 저장된 첨삭이 없어요</b>
          <small className="text-[8px] text-[#9296a6]">첫 학습지를 업로드하면 최근 작업이 여기에 보여요.</small>
        </div>
        <button
          className="ml-auto rounded-lg bg-[#f0f2ff] px-3 py-[9px] text-[8px] font-[750] text-[#5665d8] max-sm:hidden"
          onClick={onStart}
          type="button"
        >
          첫 첨삭 시작하기
        </button>
      </div>
    </>
  )
}
