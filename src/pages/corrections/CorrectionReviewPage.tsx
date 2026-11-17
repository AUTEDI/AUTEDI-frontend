import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { deleteCorrection, getPageImageUrl, getReview, setCorrectionApplied, type Correction, type Review } from '../../apis/review'
import correctionIcon from '../../assets/design-system/icon-correction.svg'
import suggestionIcon from '../../assets/design-system/icon-suggestion.svg'
import CorrectionCard from './components/CorrectionCard'
import CorrectionLayout from './components/CorrectionLayout'
import ReviewCanvas from './components/ReviewCanvas'

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** AI 첨삭 4단계: 생성된 첨삭을 학습지 위에서 확인하고 고른다. */
export default function CorrectionReviewPage() {
  const worksheetId = Number(useParams().worksheetId)
  const [review, setReview] = useState<Review | null>(null)
  const [loadError, setLoadError] = useState('')
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const [pageId, setPageId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

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

  const confirm = (correction: Correction) =>
    run(
      correction,
      async () => {
        replace(await setCorrectionApplied(worksheetId, correction, !correction.isApplied))
        // 확인하면 접어서 다음 카드를 보기 쉽게 한다.
        if (!correction.isApplied) setSelectedId(null)
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
          title={review.fileName}
          pages={review.pages}
          imageUrls={imageUrls}
          pageId={pageId}
          onPageChange={setPageId}
          corrections={review.corrections}
          selectedId={selectedId}
          onSelect={(id) => {
            const correction = review.corrections.find((item) => item.id === id)
            if (correction) select(correction)
          }}
        />

        <aside aria-label="첨삭 목록" className="flex w-[400px] shrink-0 flex-col gap-ds-20 px-ds-24">
          <div role="tablist" aria-label="첨삭 종류" className="flex">
            <button type="button" role="tab" aria-selected="true" className="h-ds-48 flex-1 border-b-2 border-solid border-border-strong text-label2-semibold text-text-neutral-default">
              AI 첨삭
            </button>
            {/* shortcut: 수기 첨삭 탭은 다음 작업에서 만든다, 그때 탭 전환과 코멘트 편집을 붙인다. */}
            <button type="button" role="tab" aria-selected="false" disabled className="h-ds-48 flex-1 border-b border-solid border-border-disabled text-label2-medium text-text-neutral-muted">
              수기 첨삭
            </button>
          </div>

          <div className="flex flex-col gap-ds-12">
            <div className="flex flex-col gap-ds-4">
              <h2 className="flex items-center gap-ds-12 text-h3">
                <span className="text-text-neutral-default">AI 첨삭</span>
                <span className="text-text-neutral-muted">{review.corrections.length}개</span>
              </h2>
              <p className="text-body2-regular text-text-neutral-subtle">코멘트를 선택하면 수정 이유와 추천 문장을 확인할 수 있어요.</p>
            </div>
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
            {actionError && (
              <p role="alert" className="text-body2-regular text-text-accent-red">
                {actionError}
              </p>
            )}
          </div>

          <ul className="flex min-h-px flex-1 flex-col gap-ds-16 overflow-y-auto pb-ds-16">
            {review.corrections.map((correction) => (
              <li key={correction.id}>
                <CorrectionCard
                  correction={correction}
                  expanded={correction.id === selectedId}
                  busy={busyId === correction.id}
                  onToggle={() => select(correction)}
                  onDelete={() => remove(correction)}
                  onConfirm={() => confirm(correction)}
                />
              </li>
            ))}
          </ul>
          {/* shortcut: 임시 저장·최종 저장과 완료 모달은 다음 작업에서 붙인다. */}
        </aside>
      </div>
    </CorrectionLayout>
  )
}
