export type ReviewSetting = {
  id: 'grammar' | 'vocabulary' | 'structure' | 'content'
  name: string
  en: string
  icon: string
  description: string
  selected: boolean
  level: 'Standard' | 'Advanced'
}

export type FeedbackItem = {
  id: string
  kind: 'correction' | 'improvement'
  category: string
  original: string
  suggestion: string
  reason: string
  x: number
  y: number
  width: number
  height: number
  noteY: number
}

export type TeacherComment = {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  color: 'blue' | 'red'
  style: 'highlight' | 'underline' | 'arrow' | 'box' | 'caret'
}
