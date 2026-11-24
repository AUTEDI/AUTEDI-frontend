import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import {
  createComment,
  deleteComment,
  deleteCorrection,
  getPageImageUrl,
  getReview,
  moveCorrection,
  setCorrectionApplied,
  type Correction,
  type Region,
  type Review,
  type TeacherComment,
} from '../../apis/review'
import correctionIcon from '../../assets/design-system/icon-correction.svg'
import suggestionIcon from '../../assets/design-system/icon-suggestion.svg'
import ActionButton from '../../components/common/ActionButton'
import CompleteModal from './components/CompleteModal'
import CorrectionCard from './components/CorrectionCard'
import CorrectionLayout from './components/CorrectionLayout'
import type { CommentKind, CommentTool } from './components/commentTools'
import ManualCommentPanel from './components/ManualCommentPanel'
import ReviewCanvas, { type NotePosition } from './components/ReviewCanvas'
import { loadWorksheetMeta } from '../../utils/worksheetMeta'
import { buildPdf, downloadPdf, preloadPdfLibraries } from './exportPdf'

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** AI 첨삭 4단계: 생성된 첨삭을 학습지 위에서 확인하고 고른다. */
export default function CorrectionReviewPage() {
  const worksheetId = Number(useParams().worksheetId)
  const navigate = useNavigate()
  // 업로드 때 고른 제목·학생(이 브라우저에 저장됨). 제목이 없으면 파일 이름을 쓴다.
  const [meta] = useState(() => loadWorksheetMeta(worksheetId))
  const [completeOpen, setCompleteOpen] = useState(false)
  // PDF는 첨삭 완료를 누르는 순간 만들기 시작한다(첨삭이 확정되는 시점이라 내용이 낡지 않는다).
  // 만드는 동안(building) 화면 밖에 페이지별 학습지를 그려 두고 이미지로 뜬다.
  const [pdf, setPdf] = useState<{ status: 'idle' | 'building' } | { status: 'ready'; blob: Blob } | { status: 'error'; message: string }>({
    status: 'idle',
  })
  // 다 만들기 전에 PDF 저장하기를 눌렀으면, 다 만들어지는 대로 바로 내려받는다.
  const [waitingPdf, setWaitingPdf] = useState(false)
  const wantPdfRef = useRef(false)
  const exportRef = useRef<HTMLDivElement>(null)
  useEffect(preloadPdfLibraries, [])
  const [review, setReview] = useState<Review | null>(null)
  const [loadError, setLoadError] = useState('')
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [pageId, setPageId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')
  // 수기 첨삭: 고른 도구·유형, 사진에서 끌어 고른 영역, 저장된 목록에서 고른 코멘트
  const [tab, setTab] = useState<'ai' | 'manual'>('ai')
  // null이면 손 모드(표시 옮기기·확대 시 사진 옮기기)
  const [tool, setTool] = useState<CommentTool | null>(null)
  const [kind, setKind] = useState<CommentKind>('RED')
  // 골라 둔 영역과 그때 쓴 도구. 도구를 바꾸면 미리보기 모양도 바뀐다.
  const [draft, setDraft] = useState<{ region: Region; tool: CommentTool } | null>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null)
  const [commentBusy, setCommentBusy] = useState(false)
  const [commentError, setCommentError] = useState('')
  // shortcut: 메모 자리는 저장할 API 필드가 없어 이 화면에서만 기억한다, 백엔드에 필드가 생기면 함께 저장한다.
  const [notePositions, setNotePositions] = useState<Record<string, NotePosition>>({})

  const validId = Number.isInteger(worksheetId)

  useEffect(() => {
    if (!validId) return
    let active = true
    const urls: string[] = []
    getReview(worksheetId)
      .then((loaded) => {
        if (!active) return
        setReview(loaded)
        setPageId(loaded.pages[0].id)
        // 페이지 사진은 각각 받아 오는 대로 보여준다.
        loaded.pages.forEach((page) => {
          getPageImageUrl(worksheetId, page.pageNumber)
            .then((url) => {
              urls.push(url)
              if (active) setImageUrls((prev) => ({ ...prev, [page.id]: url }))
            })
            .catch(() => {
              // 사진 하나를 못 받아도 첨삭 목록은 볼 수 있게 둔다.
            })
        })
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorMessage(error, '첨삭 결과를 불러오지 못했어요.'))
      })
    return () => {
      active = false
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [worksheetId, validId])

  const replace = (next: Correction) =>
    setReview((prev) => prev && { ...prev, corrections: prev.corrections.map((item) => (item.id === next.id ? next : item)) })

  // 카드나 사진 위 표시를 고르면 펼치고, 그 첨삭이 있는 페이지로 넘어간다.
  const select = (correction: Correction) => {
    const opening = selectedId !== correction.id
    setSelectedId(opening ? correction.id : null)
    const regionPage = correction.regions[0]?.pageId
    if (opening && regionPage !== undefined) setPageId(regionPage)
  }

  const run = async (correction: Correction, action: () => Promise<void>, fallback: string) => {
    setBusyId(correction.id)
    setActionError('')
    try {
      await action()
    } catch (error) {
      setActionError(errorMessage(error, fallback))
    } finally {
      setBusyId(null)
    }
  }

  // 확인: 학생 리포트에 반영하고 카드를 접는다. 디자인에 반영 취소가 없어 이미 확인한 카드는 접기만 한다.
  const confirm = (correction: Correction) =>
    run(
      correction,
      async () => {
        if (!correction.isApplied) replace(await setCorrectionApplied(worksheetId, correction, true))
        setSelectedId(null)
      },
      '첨삭을 반영하지 못했어요.',
    )

  // shortcut: 삭제를 되돌리는 안내(토스트)가 없다, 복원 API(restore)로 되돌리기를 붙일 때 함께 만든다.
  const remove = (correction: Correction) =>
    run(
      correction,
      async () => {
        await deleteCorrection(worksheetId, correction)
        setReview((prev) => prev && { ...prev, corrections: prev.corrections.filter((item) => item.id !== correction.id) })
        setSelectedId(null)
      },
      '첨삭을 삭제하지 못했어요.',
    )

  const selectComment = (comment: TeacherComment) => {
    const opening = selectedCommentId !== comment.id
    setSelectedCommentId(opening ? comment.id : null)
    if (opening) {
      setTab('manual')
      setPageId(comment.pageId)
    }
  }

  const runComment = async (action: () => Promise<void>, fallback: string) => {
    setCommentBusy(true)
    setCommentError('')
    try {
      await action()
      return true
    } catch (error) {
      setCommentError(errorMessage(error, fallback))
      return false
    } finally {
      setCommentBusy(false)
    }
  }

  // 도구를 켜면 수기 첨삭 탭으로 넘어가고, 골라 둔 영역의 모양도 그 도구로 바꾼다. null이면 손 모드로 돌아간다.
  // 도구 막대는 색(빨강·파랑)도 함께 넘겨, 첨삭 유형도 그 색으로 맞춘다.
  const changeTool = (next: CommentTool | null, nextKind?: CommentKind) => {
    setTool(next)
    if (nextKind) setKind(nextKind)
    if (!next) return
    setTab('manual')
    setDraft((prev) => prev && { ...prev, tool: next })
  }

  const saveComment = (content: string) =>
    runComment(async () => {
      if (!draft) return
      const { region } = draft
      const saved = await createComment(worksheetId, { pageId: region.pageId, highlightType: draft.tool, color: kind, regions: [region], content })
      setReview((prev) => prev && { ...prev, comments: [...prev.comments, saved] })
      setDraft(null)
      // 다 쓴 도구는 끄고 손 모드로 돌아간다.
      setTool(null)
    }, '수기 첨삭을 저장하지 못했어요.')

  // AI 첨삭 표시를 옮기면 화면에 먼저 반영하고 저장한다. 실패하면 원래 자리로 돌린다.
  const moveAiMark = async (id: number, regions: Region[]) => {
    const correction = review?.corrections.find((item) => item.id === id)
    if (!correction) return
    replace({ ...correction, regions })
    setActionError('')
    try {
      replace(await moveCorrection(worksheetId, correction, regions))
    } catch (error) {
      replace(correction)
      setActionError(errorMessage(error, '첨삭 위치를 저장하지 못했어요.'))
    }
  }

  // 수기 첨삭은 저장 뒤 위치를 바꿀 수 없어서(API), 새 자리에 다시 저장하고 원래 것을 지운다.
  const moveCommentMark = (id: number, regions: Region[]) => {
    const comment = review?.comments.find((item) => item.id === id)
    if (!comment) return
    const swap = (from: TeacherComment, to: TeacherComment) =>
      setReview((prev) => prev && { ...prev, comments: prev.comments.map((item) => (item.id === from.id ? to : item)) })
    swap(comment, { ...comment, regions })
    void runComment(async () => {
      let saved: TeacherComment
      try {
        saved = await createComment(worksheetId, { ...comment, regions })
      } catch (error) {
        swap({ ...comment, regions }, comment)
        throw error
      }
      swap({ ...comment, regions }, saved)
      if (selectedCommentId === comment.id) setSelectedCommentId(saved.id)
      // 다시 저장하면 ID가 바뀌므로, 옮겨 둔 메모 자리를 새 ID로 넘긴다.
      setNotePositions((prev) => {
        const { [`comment-${comment.id}`]: position, ...rest } = prev
        return position ? { ...rest, [`comment-${saved.id}`]: position } : prev
      })
      try {
        await deleteComment(worksheetId, comment)
      } catch (error) {
        // 원래 것이 서버에 남았으니 목록에도 다시 보여준다.
        setReview((prev) => prev && { ...prev, comments: [...prev.comments, comment] })
        throw error
      }
    }, '수기 첨삭 위치를 옮기지 못했어요.')
  }

  const removeComment = (comment: TeacherComment) =>
    runComment(async () => {
      await deleteComment(worksheetId, comment)
      setReview((prev) => prev && { ...prev, comments: prev.comments.filter((item) => item.id !== comment.id) })
      setSelectedCommentId(null)
    }, '수기 첨삭을 삭제하지 못했어요.')

  useEffect(() => {
    if (pdf.status !== 'building' || !review || !exportRef.current) return
    let active = true
    buildPdf(exportRef.current, review.pages.length)
      .then((blob) => {
        if (!active) return
        setPdf({ status: 'ready', blob })
        if (wantPdfRef.current) downloadPdf(blob, meta.title || review.fileName)
      })
      .catch((error: unknown) => {
        if (active) setPdf({ status: 'error', message: errorMessage(error, 'PDF를 만들지 못했어요. 다시 시도해 주세요.') })
      })
      .finally(() => {
        if (!active) return
        wantPdfRef.current = false
        setWaitingPdf(false)
      })
    return () => {
      active = false
    }
  }, [pdf.status, review, meta.title])

  const startPdf = () => setPdf({ status: 'building' })
  const savePdf = () => {
    if (!review) return
    if (pdf.status === 'ready') {
      downloadPdf(pdf.blob, meta.title || review.fileName)
      return
    }
    // 만드는 중이면 끝나는 대로 받고, 실패했거나 아직 시작 전이면 다시 만든다.
    wantPdfRef.current = true
    setWaitingPdf(true)
    if (pdf.status !== 'building') startPdf()
  }

  if (!review || pageId === null) {
    const message = validId ? loadError : '학습지를 찾을 수 없어요.'
    return (
      <CorrectionLayout step={4}>
        <div role={message ? 'alert' : 'status'} className="grid h-[652px] place-items-center rounded-ds-large bg-background-neutral-weak text-body1-medium text-text-neutral-muted">
          {message || '첨삭 결과를 불러오고 있어요...'}
        </div>
      </CorrectionLayout>
    )
  }

  return (
    <CorrectionLayout step={4}>
      <div className="flex h-[652px] gap-ds-24">
        <ReviewCanvas
          title={meta.title || review.fileName}
          student={meta.studentName}
          pages={review.pages}
          imageUrls={imageUrls}
          pageId={pageId}
          onPageChange={setPageId}
          corrections={review.corrections}
          selectedId={selectedId}
          onSelect={(id) => {
            const correction = review.corrections.find((item) => item.id === id)
            if (correction) {
              setTab('ai')
              select(correction)
            }
          }}
          comments={review.comments}
          selectedCommentId={selectedCommentId}
          onSelectComment={(id) => {
            const comment = review.comments.find((item) => item.id === id)
            if (comment) selectComment(comment)
          }}
          onMoveCorrection={(id, regions) => void moveAiMark(id, regions)}
          onMoveComment={moveCommentMark}
          tool={tool}
          onToolChange={changeTool}
          kind={kind}
          draft={draft}
          onDraw={(region) => tool && setDraft({ region, tool })}
          notePositions={notePositions}
          onNoteMove={(key, position) => setNotePositions((prev) => ({ ...prev, [key]: position }))}
        />

        <aside aria-label="첨삭 목록" className="flex w-[400px] shrink-0 flex-col px-ds-24">
          <div role="tablist" aria-label="첨삭 종류" className="flex">
            {(['ai', 'manual'] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                onClick={() => {
                  setTab(item)
                  // AI 첨삭 탭으로 가면 표시 도구를 끈다.
                  if (item === 'ai') setTool(null)
                  // 수기 첨삭 탭을 열면 기본 도구(밑줄)를 켜서 바로 끌어 고를 수 있게 한다.
                  else if (!tool) setTool('UNDERLINE')
                }}
                className={`h-ds-48 flex-1 border-solid ${
                  tab === item ? 'border-b-2 border-border-neutral-strong text-label2-semibold text-text-neutral-default' : 'border-b border-border-neutral-disabled text-label2-medium text-text-neutral-muted'
                }`}
              >
                {item === 'ai' ? 'AI 첨삭' : '수기 첨삭'}
              </button>
            ))}
          </div>

          {/* 탭 아래 내용만 스크롤되고, 임시 저장·첨삭 완료는 아래에 고정된다. */}
          <div className="relative min-h-0 flex-1 overflow-y-auto pt-ds-24 pb-ds-16">
            {tab === 'manual' ? (
              <ManualCommentPanel
                tool={tool}
                onToolChange={changeTool}
                kind={kind}
                onKindChange={setKind}
                hasRegion={draft !== null}
                onSave={saveComment}
                onCancel={() => {
                  setDraft(null)
                  setCommentError('')
                }}
                comments={review.comments}
                selectedCommentId={selectedCommentId}
                onSelectComment={(id) => {
                  const comment = review.comments.find((item) => item.id === id)
                  if (comment) selectComment(comment)
                }}
                onDeleteComment={removeComment}
                busy={commentBusy}
                error={commentError}
              />
            ) : (
              <div className="flex flex-col gap-ds-16">
                <div className="flex items-center justify-between gap-ds-12">
                  <h2 className="flex items-center gap-ds-8">
                    <span className="text-h3 text-text-neutral-default">AI 첨삭</span>
                    <span className="text-body1-medium text-text-neutral-muted">{review.corrections.length}개</span>
                  </h2>
                  <div className="flex items-center gap-ds-12 text-label3-semibold">
                    <span className="flex items-center gap-ds-4 text-text-accent-red">
                      <span className="flex size-ds-16 items-center justify-center">
                        <img src={correctionIcon} alt="" width={13.2} height={12} />
                      </span>
                      오류 수정
                    </span>
                    <span className="flex items-center gap-ds-4 text-text-brand-strong">
                      <img src={suggestionIcon} alt="" width={16} height={16} />
                      개선 제안
                    </span>
                  </div>
                </div>
                {actionError && (
                  <p role="alert" className="text-body2-regular text-text-accent-red">
                    {actionError}
                  </p>
                )}
                <ul className="flex flex-col gap-ds-10">
                  {review.corrections.map((correction) => (
                    <li key={correction.id}>
                      <CorrectionCard
                        correction={correction}
                        expanded={correction.id === selectedId}
                      dimmed={selectedId !== null && correction.id !== selectedId}
                        busy={busyId === correction.id}
                        onToggle={() => select(correction)}
                        onDelete={() => remove(correction)}
                        onConfirm={() => confirm(correction)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-ds-8 pt-ds-12">
            {/* shortcut: 임시 저장 API가 없다(첨삭 반영·삭제·수기 첨삭은 누를 때마다 이미 저장됨), 그래서 홈으로 나가기만 한다. 임시 저장 상태 API가 생기면 함께 부른다. */}
            <ActionButton size="md" variant="secondary" onClick={() => navigate('/main')}>
              임시 저장
            </ActionButton>
            {/* shortcut: 첨삭 완료 API가 없어 완료 안내만 띄운다, 완료 처리 API가 생기면 성공한 뒤 띄운다. */}
            <ActionButton
              size="md"
              onClick={() => {
                setCompleteOpen(true)
                // 모달을 보는 동안 PDF를 미리 만든다. 다시 누르면 그 사이 바뀐 첨삭으로 새로 만든다.
                wantPdfRef.current = false
                setWaitingPdf(false)
                startPdf()
              }}
            >
              첨삭 완료
            </ActionButton>
          </div>
        </aside>
      </div>

      <CompleteModal
        open={completeOpen}
        title={meta.title || review.fileName}
          student={meta.studentName}
        onClose={() => setCompleteOpen(false)}
        onStartNew={() => navigate('/corrections')}
        onSavePdf={savePdf}
        savingPdf={waitingPdf}
        pdfError={pdf.status === 'error' && !waitingPdf ? pdf.message : ''}
      />

      {/* PDF용: 화면 밖에 페이지마다 선택·도구 없이 첨삭 표시만 그린 학습지. 화면에 보이는 것과 같은 그리기 코드를 쓴다. */}
      {pdf.status === 'building' && (
        <div ref={exportRef} aria-hidden="true" className="pointer-events-none fixed top-0 -left-[10000px] w-[1000px]">
          {review.pages.map((item) => (
            <div key={item.id} className="flex h-[1300px]">
              <ReviewCanvas
                title={meta.title || review.fileName}
          student={meta.studentName}
                pages={review.pages}
                imageUrls={imageUrls}
                pageId={item.id}
                onPageChange={() => {}}
                corrections={review.corrections}
                selectedId={null}
                onSelect={() => {}}
                onMoveCorrection={() => {}}
                comments={review.comments}
                selectedCommentId={null}
                onSelectComment={() => {}}
                onMoveComment={() => {}}
                tool={null}
                onToolChange={() => {}}
                kind={kind}
                draft={null}
                onDraw={() => {}}
                notePositions={notePositions}
                onNoteMove={() => {}}
              />
            </div>
          ))}
        </div>
      )}
    </CorrectionLayout>
  )
}
