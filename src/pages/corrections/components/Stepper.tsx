import { Fragment } from 'react'

const STEPS = ['파일 업로드', '파일 확인', 'AI 첨삭 생성', '첨삭 검토'] as const

export type StepperProps = {
  /** 현재 단계 (1부터 시작) */
  current: 1 | 2 | 3 | 4
  className?: string
}

/** AI 첨삭 흐름의 4단계 표시 */
export default function Stepper({ current, className = '' }: StepperProps) {
  return (
    <div className={`flex w-[400px] max-w-full flex-col gap-ds-8 px-ds-24 font-sans ${className}`}>
      <div aria-hidden="true" className="flex w-full items-center">
        {STEPS.map((step, index) => {
          const active = index + 1 === current
          return (
            <Fragment key={step}>
              {index > 0 && <span className="h-0 min-w-px flex-1 border-t border-dashed border-border-default" />}
              <span
                className={`flex shrink-0 rounded-ds-full p-ds-4 ${active ? 'bg-[var(--opacity-bluebrand-a20)]' : 'bg-background-neutral-weak'}`}
              >
                <span
                  className={`flex size-[28px] items-center justify-center rounded-ds-full text-text-neutral-inverse ${
                    active ? 'bg-background-brand-strong text-label3-semibold' : 'bg-background-neutral-subtle text-label3-medium'
                  }`}
                >
                  {index + 1}
                </span>
              </span>
            </Fragment>
          )
        })}
      </div>
      <ol aria-label="AI 첨삭 단계" className="flex w-full items-center justify-between">
        {STEPS.map((step, index) => {
          const active = index + 1 === current
          return (
            <li
              key={step}
              aria-current={active ? 'step' : undefined}
              // 라벨 칸은 동그라미(36px) 폭에 맞추고 글자는 양옆으로 넘치게 둬서 동그라미 가운데에 맞춘다.
              className={`flex w-[36px] justify-center whitespace-nowrap ${
                active ? 'text-label3-semibold text-text-brand-strong' : 'text-label3-medium text-text-neutral-muted'
              }`}
            >
              {step}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
