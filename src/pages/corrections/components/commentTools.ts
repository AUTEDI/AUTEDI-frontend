import type { CommentColor, HighlightType } from '../../../apis/review'
import arrowIcon from '../../../assets/design-system/tool-arrow.svg'
import caretIcon from '../../../assets/design-system/tool-caret.svg'
import strikeIcon from '../../../assets/design-system/tool-strike.svg'
import underlineIcon from '../../../assets/design-system/tool-underline.svg'

/** 수기 첨삭 표시 도구. 아이콘은 SVG 원래 크기로 16px 칸 가운데에 놓는다. */
export const COMMENT_TOOLS = [
  { type: 'UNDERLINE', label: '밑줄', icon: underlineIcon, size: [11.25, 11.25] },
  { type: 'STRIKETHROUGH', label: '취소선', icon: strikeIcon, size: [11.25, 11.25] },
  { type: 'ARROW', label: '화살표', icon: arrowIcon, size: [11.75, 10.44] },
  { type: 'CARET', label: '삽입', icon: caretIcon, size: [11.75, 6.5] },
] as const satisfies readonly { type: HighlightType; label: string; icon: string; size: readonly [number, number] }[]

export type CommentTool = (typeof COMMENT_TOOLS)[number]['type']

/** 첨삭 유형: 오류는 빨강, 개선은 파랑으로 표시한다. */
export const COMMENT_KINDS = [
  { color: 'RED', label: '오류' },
  { color: 'BLUE', label: '개선' },
] as const satisfies readonly { color: CommentColor; label: string }[]

export type CommentKind = (typeof COMMENT_KINDS)[number]['color']

/** 표시 색(글자색). 표시는 border-current·bg-current로 이 색을 따른다. 이 화면에서 만들지 않는 노랑은 파랑으로 보여준다. */
export const toneOf = (color: CommentColor) =>
  color === 'RED' ? 'text-text-accent-red' : color === 'GREEN' ? 'text-text-accent-green' : 'text-text-brand-strong'
