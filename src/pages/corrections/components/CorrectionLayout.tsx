import type { ReactNode } from 'react'
import Stepper, { type StepperProps } from './Stepper'

/** AI 첨삭 화면들의 공통 틀: 제목·안내 문구와 단계 표시 */
export default function CorrectionLayout({ step, children }: { step: StepperProps['current']; children: ReactNode }) {
  return (
    <div className="flex min-h-full w-full min-w-0 flex-col gap-ds-24 py-ds-40 pr-[120px] pl-ds-40 font-sans">
      <header className="flex items-center justify-between gap-ds-24">
        <div className="flex flex-col gap-ds-16">
          <h1 className="text-h1 text-text-neutral-default">AI 첨삭</h1>
          <p className="text-body1-medium text-text-neutral-muted">학생의 글이 담긴 이미지나 스캔 파일을 업로드해주세요.</p>
        </div>
        <Stepper current={step} className="shrink-0" />
      </header>
      {children}
    </div>
  )
}
