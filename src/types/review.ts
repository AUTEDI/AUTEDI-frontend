export type SettingId = 'grammar' | 'vocabulary' | 'structure' | 'content'
export type FeedbackLevel = 'Standard' | 'Advanced'

export type FeedbackSetting = {
  id: SettingId
  name: string
  en: string
  icon: string
  desc: string
  selected: boolean
  level: FeedbackLevel
}

export type FlowStep = 'upload' | 'settings' | 'generation' | 'review'

/** 사진 기준 퍼센트(0~100) 좌표 */
export type Box = {
  left: number
  top: number
  width: number
  height: number
}

export type FeedbackKind = 'correction' | 'improvement'
export type AiMarkStyle = 'highlight' | 'underline'

/** AI 코멘트의 기본 위치. side는 사진의 어느 쪽에 붙는지, top은 사진 기준 퍼센트다. */
export type AiNotePlacement = {
  side: 'left' | 'right'
  top: number
  mobileTop: number
}

export type AiFeedback = {
  id: string
  kind: FeedbackKind
  category: string
  original: string
  suggestion: string
  reason: string
  markStyle: AiMarkStyle
  /** 사진 위 위치. 서버가 위치를 찾지 못한 첨삭은 null이며 목록에만 보인다. */
  mark: Box | null
  noteText: string
  notePlacement: AiNotePlacement
  /** 교사가 코멘트를 옮기면 사진 기준 퍼센트 좌표가 저장된다. */
  notePosition: { left: number; top: number } | null
  /** 수정·삭제 요청의 If-Match 값. 예시 데이터는 null이다. */
  etag: string | null
}

export type AnnotationStyle = 'highlight' | 'underline' | 'arrow' | 'box' | 'caret'
export type AnnotationColor = 'blue' | 'red'
export type ToolMode = 'idle' | 'annotate'
export type PanelMode = 'ai' | 'teacher'

export type SelectionBox = Box & {
  /** 화살표를 오른쪽에서 왼쪽으로 그렸는지 */
  reverse: boolean
}

export type TeacherComment = {
  id: string
  text: string
  style: AnnotationStyle
  color: AnnotationColor
  box: SelectionBox
  /** 캔버스 영역 기준 픽셀 좌표. 서버에서 불러온 직후에는 null이고 화면에서 배치한다. */
  note: { left: number; top: number; width: number } | null
  /** 서버에 저장된 코멘트 ID. 화면에서만 쓰는 표시(화살표 등)는 null이다. */
  serverId: string | null
  etag: string | null
}

/** 검토 화면을 여는 데 필요한 데이터 */
export type ReviewData = {
  worksheetId: number | null
  pageId: number | null
  imageUrl: string
  feedback: AiFeedback[]
  /** 서버에서 이미 반영된 첨삭 ID. 이전 응답·예시 모드에서는 생략할 수 있다. */
  appliedIds?: string[]
  teacherComments: TeacherComment[]
}
