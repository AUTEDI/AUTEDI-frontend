import { Fragment } from 'react'
import { COMMENT_TOOLS, type CommentKind, type CommentTool } from './commentTools'

export type EditorToolbarProps = {
  /** null이면 아무 도구도 켜지 않은 손 모드 */
  tool: CommentTool | null
  kind: CommentKind
  onChange: (tool: CommentTool | null, kind: CommentKind) => void
}

const COLOR = {
  RED: 'bg-background-accent-red-weak text-text-accent-red',
  BLUE: 'bg-background-brand-weak text-text-brand-strong',
} as const satisfies Record<CommentKind, string>

/**
 * 수기 첨삭 표시 도구(밑줄·취소선·화살표·삽입).
 * 같은 도구를 누를 때마다 빨강 → 파랑 → 끄기 순서로 바뀌어, 도구와 색을 한 번에 고른다. 끄면 손 모드로 돌아간다.
 */
export default function EditorToolbar({ tool, kind, onChange }: EditorToolbarProps) {
  const press = (next: CommentTool) => {
    if (tool !== next) onChange(next, 'RED')
    else if (kind === 'RED') onChange(next, 'BLUE')
    else onChange(null, kind)
  }

  return (
    <div role="group" aria-label="표시 도구" className="flex items-stretch gap-ds-8 rounded-ds-small border border-solid border-border-weak bg-background-neutral-default px-ds-8 py-ds-4">
      {COMMENT_TOOLS.map((item, index) => {
        const active = tool === item.type
        return (
          <Fragment key={item.type}>
            {index > 0 && <span aria-hidden="true" className="border-l border-border-weak" />}
            <button
              type="button"
              aria-label={`${item.label}${active ? (kind === 'RED' ? ', 빨강' : ', 파랑') : ''}`}
              aria-pressed={active}
              onClick={() => press(item.type)}
              className={`flex size-ds-24 items-center justify-center rounded-[4px] ${active ? COLOR[kind] : 'text-text-neutral-default hover:bg-background-neutral-weak'}`}
            >
              {/* 아이콘 모양만 쓰고 색은 글자색(currentColor)을 따르게 해, 한 아이콘으로 기본·빨강·파랑을 그린다. */}
              <span
                aria-hidden="true"
                className={`bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] ${item.type === 'CARET' ? '-scale-y-100' : ''}`}
                // Vite가 작은 SVG를 data: 주소로 넣는데, 따옴표가 섞여 있어 url()을 따옴표로 감싸야 한다.
                style={{ width: item.size[0], height: item.size[1], maskImage: `url("${item.icon}")`, WebkitMaskImage: `url("${item.icon}")` }}
              />
            </button>
          </Fragment>
        )
      })}
    </div>
  )
}
