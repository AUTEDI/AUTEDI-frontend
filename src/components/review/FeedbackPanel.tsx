import { useReviewStore } from '../../stores/useReviewStore'
import { cn } from '../../utils/cn'
import { AiFeedbackPanel } from './AiFeedbackPanel'
import { TeacherCommentEditor } from './TeacherCommentEditor'

function PanelModeSwitch() {
  const panelMode = useReviewStore((state) => state.panelMode)
  const showAiList = useReviewStore((state) => state.showAiList)
  const startNewTeacherComment = useReviewStore((state) => state.startNewTeacherComment)

  const tabs = [
    { mode: 'ai', icon: '✦', label: 'AI 첨삭', onClick: showAiList },
    { mode: 'teacher', icon: '✎', label: '선생님 수기 첨삭', onClick: startNewTeacherComment },
  ] as const

  return (
    <div aria-label="첨삭 패널 전환" className="-mt-1 mr-7 mb-5 grid grid-cols-2 gap-1.5 rounded-[11px] bg-[#f1f2f7] p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          aria-selected={panelMode === tab.mode}
          className={cn(
            'h-[38px] rounded-lg text-[8px] font-extrabold whitespace-nowrap max-lg:text-[7px]',
            panelMode === tab.mode ? 'bg-white text-[#4e5ed3] shadow-[0_3px_10px_rgba(34,43,95,0.09)]' : 'text-[#7a8092]',
          )}
          key={tab.mode}
          onClick={tab.onClick}
          role="tab"
          type="button"
        >
          <span className="mr-1">{tab.icon}</span> {tab.label}
        </button>
      ))}
    </div>
  )
}

function AnnotationSummary() {
  const remainingAi = useReviewStore((state) => state.feedback.length - state.dismissedIds.length)
  const teacherCount = useReviewStore((state) => state.teacherComments.length)

  return (
    <div className="mt-auto flex justify-between border-t border-line pt-[15px] text-[7px] text-[#858a9c]">
      <span>
        <b className="text-[#4d60d6]">{remainingAi}</b> AI 첨삭
      </span>
      <span>
        <b className="text-[#4d60d6]">{teacherCount}</b> 교사 코멘트
      </span>
    </div>
  )
}

export function FeedbackPanel() {
  const panelOpen = useReviewStore((state) => state.panelOpen)
  const panelMode = useReviewStore((state) => state.panelMode)
  const closePanel = useReviewStore((state) => state.closePanel)

  if (!panelOpen) return null

  return (
    <aside className="relative flex flex-col overflow-auto border-l border-[#dfe2ec] bg-white px-[18px] py-[22px] max-lg:px-[14px] sm:max-lg:py-[18px] max-sm:min-h-0 max-sm:border-t max-sm:border-l-0 max-sm:border-t-line max-sm:pt-[45px] max-sm:pb-[18px]">
      <button
        aria-label="피드백 패널 닫기"
        className="absolute top-[9px] right-[10px] z-[2] size-[27px] rounded-lg border border-[#d9ddff] bg-[#eef0ff] text-[16px] leading-none text-[#5363df] hover:border-[#bec6ff] hover:bg-[#e2e6ff] hover:text-[#3548c3]"
        onClick={closePanel}
        type="button"
      >
        ×
      </button>
      <PanelModeSwitch />
      {panelMode === 'ai' ? <AiFeedbackPanel /> : <TeacherCommentEditor />}
      <AnnotationSummary />
    </aside>
  )
}
