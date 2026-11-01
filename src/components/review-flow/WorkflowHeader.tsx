import { Fragment } from 'react'
import { FLOW_META, FLOW_STEP_COUNT } from '../../constants/flow'
import type { FlowStep } from '../../types/review'
import { cn } from '../../utils/cn'

export function WorkflowHeader({ step }: { step: FlowStep }) {
  const { title, subtitle, step: current } = FLOW_META[step]

  return (
    <div className="mb-[25px] flex items-start justify-between max-sm:block">
      <div>
        <h1 className="mt-2 mb-[7px] text-[28px] tracking-[-1.2px]">{title}</h1>
        <p className="text-[10px] text-[#7d8295]">{subtitle}</p>
      </div>
      <div aria-label={`첨삭 단계 ${current} / ${FLOW_STEP_COUNT}`} className="mt-[25px] flex items-center max-sm:hidden">
        {Array.from({ length: FLOW_STEP_COUNT }, (_, index) => (
          <Fragment key={index}>
            {index > 0 && <i className="h-px w-[33px] bg-[#dfe1e9]" />}
            <span
              className={cn(
                'grid size-[25px] place-items-center rounded-full border text-[8px]',
                index < current
                  ? 'border-[#5a66e1] bg-[linear-gradient(135deg,#7377f1,#4559d8)] text-white shadow-[0_0_0_5px_#eaecff]'
                  : 'border-[#d7dae6] text-[#989cac]',
              )}
            >
              {index + 1}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
