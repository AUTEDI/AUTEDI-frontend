import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/** 진행 표시 단계. 실제 생성 완료 시점은 API 응답이 정한다. */
const STAGES = [
  {
    at: 0,
    progress: 10,
    copy: '사진 속 글의 위치를 찾고 문법과 표현을 분석하는 중이에요.',
    analysis: '○',
    layer: '○',
  },
  { at: 650, progress: 45, copy: '문법과 표현을 원문 위치와 함께 확인하고 있어요.', analysis: '✓', layer: '○' },
  { at: 1400, progress: 78, copy: '사진 위에 표시할 피드백 레이어를 정리하고 있어요.', analysis: '✓', layer: '●' },
  { at: 2150, progress: 100, copy: '사진 위에 표시할 피드백 레이어를 정리하고 있어요.', analysis: '✓', layer: '✓' },
]

function ScanVisual() {
  return (
    <div aria-hidden="true" className="relative grid h-[210px] place-items-center">
      <div className="relative z-[2] h-[176px] w-[135px] rotate-[4deg] overflow-hidden rounded-[13px] bg-white px-[23px] py-[37px] shadow-[0_25px_55px_rgba(32,42,105,0.2)] before:absolute before:top-[15px] before:left-6 before:font-serif before:text-[13px] before:font-bold before:text-[#5363d9] before:content-['A']">
        <div className="absolute inset-x-0 h-0.5 animate-scan bg-[#6474ec] shadow-[0_0_14px_4px_rgba(100,116,236,0.5)]" />
        <span className="mb-[13px] block h-1.5 rounded-[5px] bg-[#e6e8f2]" />
        <span className="mb-[13px] block h-1.5 rounded-[5px] bg-[#e6e8f2]" />
        <span className="mb-[13px] block h-1.5 w-[60%] rounded-[5px] bg-[#e6e8f2]" />
        <span className="mb-[13px] block h-1.5 rounded-[5px] bg-[#e6e8f2]" />
        <i className="absolute top-[38px] -right-[18px] size-4 rounded-full border-4 border-[#dfe3ff] bg-[#6675eb]" />
        <i className="absolute top-[90px] -left-[17px] size-4 rounded-full border-4 border-[#dfe3ff] bg-[#6675eb]" />
        <i className="absolute -right-[13px] bottom-[30px] size-4 rounded-full border-4 border-[#dfe3ff] bg-[#6675eb]" />
      </div>
      <div className="absolute h-[170px] w-[260px] rounded-full bg-[radial-gradient(closest-side,rgba(104,118,238,0.24),transparent)]" />
    </div>
  )
}

export function GenerationStep() {
  const [stageIndex, setStageIndex] = useState(0)
  const stage = STAGES[stageIndex]

  useEffect(() => {
    const timers = STAGES.slice(1).map((next, index) => window.setTimeout(() => setStageIndex(index + 1), next.at))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <div className="animate-fade-step pt-[5px] text-center">
      <ScanVisual />
      <h2 className="my-[9px] text-[25px] tracking-[-1px]">학생의 글을 꼼꼼히 읽고 있어요</h2>
      <p className="my-[10px] text-[10px] text-[#7d8294]">{stage.copy}</p>
      <div className="mx-auto mt-[23px] mb-[14px] h-[5px] w-[370px] max-w-[85vw] overflow-hidden rounded-[10px] bg-[#e1e4ef]">
        <i
          className="block h-full bg-[linear-gradient(90deg,#7d88f1,#4358d7)] transition-[width] duration-500"
          style={{ width: `${stage.progress}%` }}
        />
      </div>
      <div className="flex justify-center gap-[18px] text-[8px] text-[#999eae]">
        <span className="text-[#5363d6]">✓ 이미지 인식</span>
        <span className={cn(stage.analysis !== '○' && 'text-[#5363d6]')}>{stage.analysis} 선택 영역 분석</span>
        <span className={cn(stage.layer !== '○' && 'text-[#5363d6]')}>{stage.layer} 첨삭 레이어 생성</span>
      </div>
      <small className="mt-[18px] block text-[7px] text-[#a0a4b2]">원본 사진의 픽셀은 변경하지 않아요.</small>
    </div>
  )
}
