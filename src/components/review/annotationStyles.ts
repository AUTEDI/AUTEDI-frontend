import type { AnnotationColor, AnnotationStyle } from '../../types/review'
import { cn } from '../../utils/cn'

export const ANNOTATION_STYLES: { id: AnnotationStyle; name: string; toolbarLabel: string; icon: string }[] = [
  { id: 'underline', name: '밑줄', toolbarLabel: '밑줄', icon: 'U̲' },
  { id: 'arrow', name: '화살표', toolbarLabel: '수평 화살표', icon: '→' },
  { id: 'box', name: '네모', toolbarLabel: '네모 표시', icon: '□' },
  { id: 'caret', name: '삽입 표시', toolbarLabel: '삽입 표시', icon: '⌃' },
]

/** 크기 조절 핸들을 보여주는 교사 표시 */
export const RESIZABLE_STYLES: AnnotationStyle[] = ['arrow', 'box', 'caret']

const INK: Record<AnnotationColor, { text: string; border: string; fill: string }> = {
  blue: { text: 'text-improvement', border: 'border-improvement', fill: 'bg-[rgba(52,124,255,0.18)]' },
  red: { text: 'text-correction', border: 'border-correction', fill: 'bg-[rgba(255,62,91,0.18)]' },
}

const ARROW_HEAD_RIGHT =
  "after:absolute after:top-0 after:right-0 after:size-0 after:border-y-[5px] after:border-l-8 after:border-y-transparent after:border-l-current after:content-['']"
const ARROW_HEAD_LEFT =
  "after:absolute after:top-0 after:left-0 after:size-0 after:border-y-[5px] after:border-r-8 after:border-y-transparent after:border-r-current after:content-['']"

/** 교사 표시(하이라이트·밑줄·화살표·네모·삽입 표시)의 모양 */
export function teacherMarkClass(style: AnnotationStyle, color: AnnotationColor, reverse: boolean) {
  const ink = INK[color]
  switch (style) {
    case 'highlight':
      return ink.fill
    case 'underline':
      return cn('border-b-2', ink.border)
    case 'box':
      return cn('border-2 border-current', ink.text)
    case 'arrow':
      return cn(
        'overflow-visible',
        ink.text,
        "before:absolute before:inset-x-0 before:top-1 before:border-t-2 before:border-current before:content-['']",
        reverse ? ARROW_HEAD_LEFT : ARROW_HEAD_RIGHT,
      )
    case 'caret':
      return cn(
        ink.text,
        "before:absolute before:bottom-0 before:left-0 before:w-[54%] before:origin-right before:-rotate-30 before:border-t-[3px] before:border-current before:content-['']",
        "after:absolute after:right-0 after:bottom-0 after:w-[54%] after:origin-left after:rotate-30 after:border-t-[3px] after:border-current after:content-['']",
      )
  }
}
