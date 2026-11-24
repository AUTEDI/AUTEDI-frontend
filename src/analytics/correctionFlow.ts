import type { CommentKind, CommentTool } from '../pages/corrections/components/commentTools'
import type { AnalyticsEvent, EventProperties, EventSink } from './events'

type Step = 'upload' | 'settings' | 'generation' | 'review' | 'completion_shown'
type ManualAction = 'tab_selected' | 'tool_selected' | 'kind_selected' | 'region_selected' | 'save_requested' | 'saved' | 'save_failed' | 'cancelled'
type ManualContext = {
  source: 'tabs' | 'toolbar' | 'panel' | 'canvas'
  tab: 'ai' | 'manual'
  next_tab?: 'ai' | 'manual'
  tool: CommentTool | null
  kind: CommentKind
}

/** Router state에는 분석용 UUID만 전달한다. URL·학습지 ID·입력 내용은 전송하지 않는다. */
export function flowIdFromState(state: unknown): string | undefined {
  const value = (state as { correctionFlowId?: unknown } | null)?.correctionFlowId
  return typeof value === 'string' && /^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value) ? value : undefined
}

export function createCorrectionFlow(sink: EventSink, id: string = crypto.randomUUID(), now = Date.now) {
  let step: Step | null = null
  let enteredAt = now()
  let sequence = 0
  let firstEntry: 'tab' | 'tool' | null = null
  let previousAction: ManualAction | null = null
  const manualSessionId = crypto.randomUUID()

  const record = (event: AnalyticsEvent, properties: EventProperties = {}) => sink(event, { ...properties, flow_id: id })
  return {
    id,
    record,
    view(next: Step) {
      if (step === next) return
      const time = now()
      record('Correction Step Viewed', { step: next, previous_step: step, previous_step_ms: time - enteredAt })
      step = next
      enteredAt = time
    },
    manual(action: ManualAction, context: ManualContext) {
      if (!firstEntry) {
        if (action === 'tab_selected' && context.next_tab === 'manual') firstEntry = 'tab'
        if (action === 'tool_selected' && context.tool !== null) firstEntry = 'tool'
      }
      record('Manual Correction Interaction', {
        source: context.source,
        tab: context.tab,
        next_tab: context.next_tab ?? context.tab,
        tool: context.tool,
        kind: context.kind,
        manual_session_id: manualSessionId,
        action,
        sequence: ++sequence,
        first_entry: firstEntry,
        previous_action: previousAction,
      })
      previousAction = action
    },
  }
}
