import { useEffect, useState } from 'react'

export function GenerationScreen() {
  const [progress, setProgress] = useState(8)

  useEffect(() => {
    const analysisTimer = window.setTimeout(() => setProgress(45), 650)
    const feedbackTimer = window.setTimeout(() => setProgress(78), 1400)
    const finishTimer = window.setTimeout(() => setProgress(100), 2150)
    return () => {
      window.clearTimeout(analysisTimer)
      window.clearTimeout(feedbackTimer)
      window.clearTimeout(finishTimer)
    }
  }, [])

  return (
    <div className="generation-screen">
      <div aria-hidden="true" className="generation-art">
        <div className="scan-paper">
          <span />
          <span />
          <span className="short" />
          <span />
          <i className="scan-highlight" />
        </div>
        <div className="scan-halo" />
      </div>
      <span className="eyebrow">AI REVIEW IN PROGRESS</span>
      <h2>로컬 첨삭 작업을 준비하고 있어요</h2>
      <p>예시 학습지는 설정별 목업 결과를, 업로드한 사진은 수기 첨삭 작업 공간을 준비합니다.</p>
      <div aria-label={`첨삭 진행 ${progress}%`} className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="generation-steps">
        <span className="done">✓ 이미지 준비</span>
        <i />
        <span className={progress > 38 ? 'done' : ''}>{progress > 38 ? '✓' : '○'} 설정 확인</span>
        <i />
        <span className={progress > 72 ? 'done' : ''}>{progress > 72 ? '●' : '○'} 첨삭 레이어 생성</span>
      </div>
      <small>원본 사진의 픽셀은 변경하지 않아요.</small>
    </div>
  )
}
