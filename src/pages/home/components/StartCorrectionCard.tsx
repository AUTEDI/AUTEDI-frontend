import arrowRight from '../../../assets/design-system/cta-arrow-right.svg'
import CTAButton from '../../../components/common/CTAButton'

export default function StartCorrectionCard() {
  return (
    <section
      aria-labelledby="start-correction-heading"
      className="flex min-h-[360px] items-center justify-between gap-ds-24 overflow-hidden rounded-ds-large bg-ds-blue-100 px-ds-60 max-sm:px-ds-24"
    >
      <div className="flex shrink-0 flex-col items-start gap-ds-48 py-ds-32">
        <div className="flex flex-col gap-ds-4">
          <h2 id="start-correction-heading" className="text-h2 text-text-neutral-default">새 첨삭을 시작하세요</h2>
          <p className="text-body1-medium text-text-neutral-subtle">
            학생의 학습지를 촬영하거나 파일로 올리면<br />
            AI가 사진 위에 바로 첨삭을 표시해요.
          </p>
        </div>
        <CTAButton to="/corrections" className="gap-ds-8 rounded-ds-small">
          새 첨삭 시작
          <span aria-hidden="true" className="flex size-ds-16 items-center justify-center">
            <img src={arrowRight} alt="" />
          </span>
        </CTAButton>
      </div>
      {/* 그래픽이 확정되기 전까지 내부 이미지는 비워둡니다. */}
      <div aria-hidden="true" className="h-[300px] w-[520px] shrink bg-white max-sm:hidden" />
    </section>
  )
}
