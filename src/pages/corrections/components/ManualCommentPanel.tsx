import { useEffect, useRef, useState } from 'react'
import type { TeacherComment } from '../../../apis/review'
import chevronIcon from '../../../assets/design-system/icon-chevron-down.svg'
import correctionIcon from '../../../assets/design-system/icon-correction.svg'
import suggestionIcon from '../../../assets/design-system/icon-suggestion.svg'
import ActionButton from '../../../components/common/ActionButton'
import Select from '../../../components/common/Select'
import { COMMENT_KINDS, COMMENT_TOOLS, toneOf, type CommentKind, type CommentTool } from './commentTools'

const MAX_LENGTH = 200

export type ManualCommentPanelProps = {
  /** 켜진 도구. null이면 꺼진 상태(손 모드) */
  tool: CommentTool | null
  onToolChange: (tool: CommentTool) => void
  kind: CommentKind
  onKindChange: (kind: CommentKind) => void
  /** 사진에서 영역을 골랐는지 */
  hasRegion: boolean
  /** 저장에 성공하면 true를 돌려준다. */
  onSave: (content: string) => Promise<boolean>
  onCancel: () => void
  comments: readonly TeacherComment[]
  selectedCommentId: number | null
  onSelectComment: (commentId: number) => void
  onDeleteComment: (comment: TeacherComment) => void
  busy: boolean
  error: string
}

/** 수기 첨삭 탭: 표시 도구·유형을 고르고 코멘트를 적어 저장한다. 아래에 저장된 수기 첨삭이 보인다. */
export default function ManualCommentPanel({
  tool,
  onToolChange,
  kind,
  onKindChange,
  hasRegion,
  onSave,
  onCancel,
  comments,
  selectedCommentId,
  onSelectComment,
  onDeleteComment,
  busy,
  error,
}: ManualCommentPanelProps) {
  const [content, setContent] = useState('')
  // 사진에서 수기 첨삭 표시를 누르면 목록의 그 항목이 보이도록 스크롤한다.
  const selectedRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedCommentId])
  const row = 'flex items-center justify-between'
  const rowLabel = 'text-label2-medium text-text-neutral-default'

  return (
    <div className="flex flex-col gap-ds-24">
      <div className="flex flex-col gap-ds-16">
        <h2 className="text-h3 text-text-neutral-default">수기 첨삭 추가</h2>

        <form
          className="flex flex-col gap-ds-24 rounded-ds-medium border border-solid border-border-default bg-background-neutral-default p-ds-16"
          onSubmit={async (event) => {
            event.preventDefault()
            if (await onSave(content.trim())) setContent('')
          }}
        >
          <div className="flex flex-col gap-ds-16">
            <div className="flex flex-col gap-ds-8">
              <div className={row}>
                <span aria-hidden="true" className={rowLabel}>도구</span>
                {/* shortcut: 공통 Select에 아이콘 옵션이 없어 글자만 보인다, Select가 아이콘을 지원하면 도구 아이콘을 붙인다. */}
                <Select
                  label="도구"
                  className="!w-[120px]"
                  options={COMMENT_TOOLS.map((item) => ({ value: item.type, label: item.label }))}
                  // 도구가 꺼져 있어도 기본 도구인 밑줄을 보여준다. 고르면 그 도구가 켜진다.
                  value={tool ?? 'UNDERLINE'}
                  onValueChange={(value) => onToolChange(value as CommentTool)}
                />
              </div>
              <div className={row}>
                <span aria-hidden="true" className={rowLabel}>첨삭 유형</span>
                <Select
                  label="첨삭 유형"
                  className="!w-[120px]"
                  options={COMMENT_KINDS.map((item) => ({ value: item.color, label: item.label }))}
                  value={kind}
                  onValueChange={(value) => onKindChange(value as CommentKind)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-ds-16">
              <label htmlFor="manual-comment" className={rowLabel}>수정 제안</label>
              <div className="flex h-[91px] flex-col justify-between rounded-ds-medium border border-solid border-border-default px-ds-12 py-ds-8 focus-within:outline-2 focus-within:outline-border-focused">
                <textarea
                  id="manual-comment"
                  value={content}
                  maxLength={MAX_LENGTH}
                  placeholder="수정할 내용을 입력하세요."
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-px flex-1 resize-none bg-transparent text-body2-regular text-text-neutral-default outline-none placeholder:text-text-neutral-subtle"
                />
                <p className="text-right text-caption text-text-neutral-muted">
                  {content.length}/{MAX_LENGTH}
                </p>
              </div>
            </div>
            {error ? (
              <p role="alert" className="text-body2-regular text-text-accent-red">{error}</p>
            ) : (
              !hasRegion && <p className="text-caption text-text-neutral-muted">사진에서 첨삭할 부분을 먼저 끌어서 골라주세요.</p>
            )}
          </div>
          <div className="flex justify-end gap-ds-10">
            <ActionButton
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setContent('')
                onCancel()
              }}
            >
              취소
            </ActionButton>
            <ActionButton type="submit" size="sm" variant="neutral" disabled={busy || !hasRegion || !content.trim()}>
              저장
            </ActionButton>
          </div>
        </form>
      </div>

      <div className="flex flex-col gap-ds-16">
        <h2 className="text-h3 text-text-neutral-default">저장된 수기 첨삭</h2>
        {comments.length === 0 ? (
          <p className="text-body2-regular text-text-neutral-subtle">아직 저장된 수기 첨삭이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-ds-16">
            {comments.map((comment) => {
              const selected = comment.id === selectedCommentId
              return (
                <li key={comment.id} ref={selected ? selectedRef : undefined} className="flex flex-col gap-ds-12 rounded-ds-medium border border-solid border-border-default bg-background-neutral-default px-ds-16 py-ds-12">
                  <button type="button" aria-expanded={selected} onClick={() => onSelectComment(comment.id)} className="flex w-full items-center justify-between gap-ds-12 text-left">
                    <span className="flex min-w-px items-center gap-ds-12">
                      <span className={`flex shrink-0 items-center gap-ds-4 rounded-ds-small border border-solid border-current px-ds-12 py-ds-4 text-label2-semibold ${toneOf(comment.color)}`}>
                        <span className="flex size-ds-16 items-center justify-center">
                          {comment.color === 'RED' ? (
                            <img src={correctionIcon} alt="" width={13.2} height={12} />
                          ) : (
                            <img src={suggestionIcon} alt="" width={16} height={16} />
                          )}
                        </span>
                        {comment.color === 'RED' ? '오류' : '개선'}
                      </span>
                      <span className={`text-body1-medium text-text-neutral-default ${selected ? 'break-words' : 'truncate'}`}>{comment.content}</span>
                    </span>
                    <span aria-hidden="true" className="flex size-ds-16 shrink-0 items-center justify-center">
                      <img src={chevronIcon} alt="" width={11.75} height={6.5} className={selected ? '' : '-rotate-90'} />
                    </span>
                  </button>
                  {selected && (
                    <div className="flex justify-end">
                      {/* shortcut: 저장된 수기 첨삭의 내용 고치기(PATCH)는 아직 없다, 편집 UI 디자인이 나오면 updateComment를 붙인다. */}
                      <ActionButton size="sm" variant="secondary" disabled={busy} onClick={() => onDeleteComment(comment)}>
                        삭제
                      </ActionButton>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
