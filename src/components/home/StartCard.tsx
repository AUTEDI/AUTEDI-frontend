import { Button } from '../common/Button'

function StartVisual() {
  return (
    <div aria-hidden="true" className="relative h-[210px] w-[220px] flex-none max-sm:hidden">
      <div className="absolute top-[5px] left-[53px] h-[174px] w-[128px] rotate-[7deg] rounded-[13px] bg-white px-5 py-10 shadow-[0_22px_45px_rgba(0,0,0,0.25)] before:absolute before:top-4 before:left-5 before:font-serif before:text-[15px] before:font-bold before:text-[#5364dc] before:content-['A']">
        <i className="mb-[15px] block h-1.5 rounded-[3px] bg-[#e5e7f2]" />
        <i className="mb-[15px] block h-1.5 rounded-[3px] bg-[#e5e7f2]" />
        <i className="mb-[15px] block h-1.5 rounded-[3px] bg-[#e5e7f2]" />
        <span className="absolute -right-[19px] bottom-[25px] grid size-[41px] place-items-center rounded-full bg-[#6574ec] text-white shadow-[0_0_0_7px_rgba(102,116,236,0.18)]">
          ✦
        </span>
      </div>
      <div className="absolute bottom-[9px] left-[10px] size-[55px] rounded-full bg-[linear-gradient(135deg,#afb6ff,#5665d2)]" />
      <div className="absolute top-[35px] right-0.5 size-[30px] rounded-full bg-[#d9ddff]" />
    </div>
  )
}

export function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <article className="relative flex min-h-[285px] items-center gap-11 overflow-hidden rounded-[20px] border border-line bg-[linear-gradient(145deg,#191c31_0%,#1c2448_58%,#27357a_100%)] px-[35px] py-8 text-white shadow-[0_12px_38px_rgba(28,38,90,0.05)] max-sm:gap-[15px] max-sm:p-[25px]">
      <StartVisual />
      <div>
        <h2 className="mt-[7px] mb-[9px] text-[21px] tracking-[-0.8px]">새 첨삭을 시작하세요</h2>
        <p className="mb-[22px] text-[10px] leading-[1.75] text-[#b3b8cf]">
          학생의 학습지를 촬영하거나 파일로 올리면
          <br />
          AI가 사진 위에 바로 첨삭을 표시해요.
        </p>
        <Button onClick={onStart} variant="primary">
          새 첨삭 시작 <b className="ml-2">→</b>
        </Button>
      </div>
    </article>
  )
}
