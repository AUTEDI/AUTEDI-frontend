import { useEffect, useRef } from 'react'
import { getErrorMessage } from '../apis/errors'
import { reviewService } from '../apis/reviewService'
import { GenerationStep } from '../components/review-flow/GenerationStep'
import { SessionSettingsStep } from '../components/review-flow/SessionSettingsStep'
import { UploadStep } from '../components/review-flow/UploadStep'
import { WorkflowHeader } from '../components/review-flow/WorkflowHeader'
import { ReviewStep } from '../components/review/ReviewStep'
import { useAppStore } from '../stores/useAppStore'
import { useReviewStore } from '../stores/useReviewStore'
import type { FeedbackSetting } from '../types/review'

export function ReviewPage() {
  const step = useAppStore((state) => state.step)
  const setStep = useAppStore((state) => state.setStep)
  const resetSessionSettings = useAppStore((state) => state.resetSessionSettings)
  const showToast = useAppStore((state) => state.showToast)
  const markWorksheetReady = useAppStore((state) => state.markWorksheetReady)
  const startReview = useReviewStore((state) => state.startReview)
  const activeReviewId = useReviewStore((state) => state.activeUploadId)
  // 화면을 벗어나면 진행 중인 생성 확인(폴링)을 멈춘다.
  const generation = useRef<AbortController | null>(null)

  useEffect(() => () => generation.current?.abort(), [])

  const runGeneration = async (settings: FeedbackSetting[], uploadId?: string) => {
    const { uploads, activeUploadId, uploading } = useAppStore.getState()
    const upload = uploads.find((file) => file.id === (uploadId ?? activeUploadId))
    if (!upload || uploading || useReviewStore.getState().pendingMutations) return
    // 이미 검토한 파일은 화면에서 수정한 내용까지 복원한다.
    if (useReviewStore.getState().selectReview(upload.id)) {
      useAppStore.getState().selectUpload(upload.id)
      setStep('review')
      return
    }
    // 업로드 때 이미 분석이 끝났다면 생성 화면이나 추가 API 요청 없이 바로 연다.
    if (upload.worksheet.completedReview) {
      startReview(upload.id, upload.worksheet.completedReview)
      useAppStore.getState().selectUpload(upload.id)
      setStep('review')
      return
    }
    if (!settings.some((setting) => setting.selected)) {
      showToast('첨삭 영역을 한 가지 이상 선택해주세요')
      return
    }
    generation.current?.abort()
    const controller = new AbortController()
    generation.current = controller
    const previousStep = useAppStore.getState().step
    setStep('generation')
    try {
      const review = await reviewService.generateReview({
        worksheet: upload.worksheet,
        settings,
        signal: controller.signal,
      })
      if (controller.signal.aborted || useAppStore.getState().step !== 'generation') return
      markWorksheetReady(upload.id)
      startReview(upload.id, review)
      useAppStore.getState().selectUpload(upload.id)
      setStep('review')
    } catch (error) {
      if (controller.signal.aborted) return
      showToast(getErrorMessage(error, '첨삭을 생성하지 못했어요. 잠시 후 다시 시도해주세요.'))
      setStep(previousStep === 'review' ? 'review' : 'upload')
    }
  }

  const startWithDefaults = () => {
    resetSessionSettings()
    void runGeneration(useAppStore.getState().defaults)
  }

  const customizeSettings = () => {
    resetSessionSettings()
    setStep('settings')
  }

  return (
    <section className="mx-auto max-w-[1500px] animate-fade-page px-[42px] pt-9 pb-6 max-sm:px-[14px] max-sm:py-[25px]">
      <WorkflowHeader step={step} />
      {step === 'upload' && <UploadStep onCustomize={customizeSettings} onStart={startWithDefaults} />}
      {step === 'settings' && (
        <SessionSettingsStep onStart={() => void runGeneration(useAppStore.getState().sessionSettings)} />
      )}
      {step === 'generation' && <GenerationStep />}
      {step === 'review' && (
        <ReviewStep
          key={activeReviewId}
          onSelectFile={(uploadId) => void runGeneration(useAppStore.getState().sessionSettings, uploadId)}
        />
      )}
    </section>
  )
}
