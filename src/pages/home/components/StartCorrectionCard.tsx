import arrowRight from '../../../assets/design-system/cta-arrow-right.svg'
import CTAButton from '../../../components/common/CTAButton'
import StartCorrectionGraphic from './StartCorrectionGraphic'

export default function StartCorrectionCard() {
  return (
    <section
      aria-labelledby="start-correction-heading"
      className="@container/start-correction relative isolate flex min-h-[360px] items-center justify-between gap-ds-24 overflow-hidden rounded-ds-large bg-linear-to-r/srgb from-[#c3c9f4] to-[#e4e6f3] px-ds-60 py-ds-24 max-sm:px-ds-24"
    >
      <div className="relative z-10 flex shrink-0 flex-col items-start gap-ds-48">
        <div className="flex flex-col gap-ds-8">
          <h2 id="start-correction-heading" className="text-h2 text-text-neutral-default">새 첨삭을 시작하세요</h2>
          <p className="text-body1-medium text-text-neutral-subtle">
            학생의 학습지를 촬영하거나 파일로 올리면<br />
            AI가 사진 위에 바로 첨삭을 표시해요.
          </p>
        </div>
        <CTAButton to="/corrections" className="gap-ds-8 rounded-ds-small!">
          새 첨삭 시작
          <span aria-hidden="true" className="flex size-ds-16 items-center justify-center">
            <img src={arrowRight} alt="" />
          </span>
        </CTAButton>
      </div>
      <StartCorrectionGraphic />
    </section>
  )
}
