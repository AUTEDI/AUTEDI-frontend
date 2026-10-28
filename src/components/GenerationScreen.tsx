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
      <h2>학생의 글을 꼼꼼히 읽고 있어요</h2>
      <p>사진 속 글의 위치를 찾고 문법과 표현을 분석하는 중이에요.</p>
      <div aria-label={`첨삭 진행 ${progress}%`} className="progress-track">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="generation-steps">
        <span className="done">✓ 이미지 인식</span>
        <i />
        <span className={progress > 38 ? 'done' : ''}>{progress > 38 ? '✓' : '○'} 선택 영역 분석</span>
        <i />
        <span className={progress > 72 ? 'done' : ''}>{progress > 72 ? '●' : '○'} 첨삭 레이어 생성</span>
      </div>
      <small>원본 사진의 픽셀은 변경하지 않아요.</small>
    </div>
  )
}
