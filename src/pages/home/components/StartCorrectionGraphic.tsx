import guidedFeedback from '../../../assets/home/guided-feedback.svg'

export default function StartCorrectionGraphic() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-[300px] w-[520px] shrink-0 @max-[904px]/start-correction:absolute @max-[904px]/start-correction:right-ds-24 @max-[904px]/start-correction:opacity-30 @max-[480px]/start-correction:hidden"
    >
      {/* 원본 그래픽은 520 × 300 슬롯을 넘어가며 카드의 경계에서 잘립니다. */}
      <div className="absolute top-1/2 left-[calc(50%-0.22px)] h-[300px] w-[477.551px] -translate-x-1/2 -translate-y-1/2">
        <img src={guidedFeedback} alt="" className="absolute top-[-33.08%] left-[-36.1%] max-w-none" />
      </div>
    </div>
  )
}
