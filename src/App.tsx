import sampleWriting from './assets/sample-writing.jpeg'
import { lazy, Suspense, useEffect } from 'react'
import { AppShell } from './components/AppShell'
import { GenerationScreen } from './components/GenerationScreen'
import { HomeScreen } from './components/HomeScreen'
import { SessionSettingsScreen, UploadScreen } from './components/UploadScreen'
import { generateReview } from './services/reviewService'
import { useAppStore } from './store/useAppStore'
import './App.css'

const ReviewWorkspace = lazy(() =>
  import('./features/review/ReviewWorkspace').then(({ ReviewWorkspace: Component }) => ({
    default: Component,
  })),
)

function App() {
  const page = useAppStore((state) => state.page)
  const step = useAppStore((state) => state.step)
  const sessionSettings = useAppStore((state) => state.sessionSettings)
  const setPage = useAppStore((state) => state.setPage)
  const setStep = useAppStore((state) => state.setStep)
  const setFeedback = useAppStore((state) => state.setFeedback)
  const showToast = useAppStore((state) => state.showToast)

  useEffect(() => {
    if (page !== 'review' || step !== 'generation') return
    let active = true
    generateReview(sessionSettings, useAppStore.getState().imageUrl === sampleWriting)
      .then(({ feedback }) => {
        if (!active) return
        setFeedback(feedback)
        setStep('canvas')
      })
      .catch((error: unknown) => {
        if (!active) return
        console.error('Failed to generate the mock review.', error)
        setStep('settings')
        showToast('첨삭을 생성하지 못했어요. 설정을 확인한 뒤 다시 시도해주세요.')
      })
    return () => {
      active = false
    }
  }, [page, sessionSettings, setFeedback, setStep, showToast, step])

  const startReview = () => {
    useAppStore.getState().startNewReview()
  }

  const startGeneration = () => {
    if (!useAppStore.getState().imageUrl) {
      showToast('먼저 학습지 이미지를 올려주세요')
      setStep('upload')
      return
    }
    setStep('generation')
  }

  const stepNumber = step === 'canvas' ? 3 : step === 'generation' ? 2 : 1

  return (
    <AppShell onNavigate={setPage}>
      {page === 'home' ? (
        <HomeScreen onStart={startReview} />
      ) : (
        <section className={`workflow-page step-${step}`}>
          <div className="workflow-head">
            <div>
              <span className="eyebrow">TEACHER WORKSPACE</span>
              <h1>
                {step === 'upload' && '학생의 학습지를 올려주세요'}
                {step === 'settings' && '이번 첨삭 설정을 확인해주세요'}
                {step === 'generation' && 'AI 첨삭을 생성하고 있어요'}
                {step === 'canvas' && '사진 위 첨삭 결과를 확인해주세요'}
              </h1>
              <p>
                {step === 'canvas'
                  ? '원본 사진 위 표시를 선택하면 수정 이유와 추천 문장을 확인할 수 있어요.'
                  : '글이 적힌 실제 사진이나 스캔 파일을 업로드하세요. 원본 이미지는 수정되지 않아요.'}
              </p>
            </div>
            <div aria-label={`첨삭 단계 ${stepNumber} / 3`} className="stepper">
              <span className={stepNumber >= 1 ? 'active' : ''}>1</span>
              <i />
              <span className={stepNumber >= 2 ? 'active' : ''}>2</span>
              <i />
              <span className={stepNumber >= 3 ? 'active' : ''}>3</span>
            </div>
          </div>
          {step === 'upload' && (
            <UploadScreen onGenerate={startGeneration} onHome={() => setPage('home')} />
          )}
          {step === 'settings' && (
            <SessionSettingsScreen
              onBack={() => setStep('upload')}
              onGenerate={startGeneration}
            />
          )}
          {step === 'generation' && <GenerationScreen />}
          {step === 'canvas' && (
            <Suspense fallback={<div className="canvas-loading">첨삭 캔버스를 준비하고 있어요...</div>}>
              <ReviewWorkspace onBack={() => setStep('upload')} />
            </Suspense>
          )}
        </section>
      )}
    </AppShell>
  )
}

export default App
