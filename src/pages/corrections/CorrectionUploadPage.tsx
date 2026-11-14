import { useEffect, useRef, useState } from 'react'
import ActionButton from '../../components/common/ActionButton'
import SegmentedControl from '../../components/common/SegmentedControl'
import Select from '../../components/common/Select'
import TextField from '../../components/common/TextField'
import FileDropzone from './components/FileDropzone'
import FilePreviewPanel, { type PreviewPage } from './components/FilePreviewPanel'
import QrUploadModal from './components/QrUploadModal'
import Stepper from './components/Stepper'

type Level = 'standard' | 'advanced'

const AREAS = [
  { id: 'grammar', label: '문법 및 철자' },
  { id: 'vocabulary', label: '어휘 및 표현' },
  { id: 'structure', label: '문장 구성' },
  { id: 'content', label: '내용 및 요약' },
] as const

type AreaId = (typeof AREAS)[number]['id']
type Levels = Record<AreaId, Level>

const DEFAULT_LEVELS: Levels = { grammar: 'standard', vocabulary: 'standard', structure: 'standard', content: 'standard' }
// 마지막으로 고른 첨삭 영역 설정을 다음 첨삭에 다시 적용한다.
const LEVELS_KEY = 'autedi.correctionLevels'

function loadLevels(): Levels {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(LEVELS_KEY) ?? 'null')
    if (typeof saved !== 'object' || saved === null) return DEFAULT_LEVELS
    const levels = { ...DEFAULT_LEVELS }
    for (const { id } of AREAS) {
      const value = (saved as Record<string, unknown>)[id]
      if (value === 'standard' || value === 'advanced') levels[id] = value
    }
    return levels
  } catch {
    return DEFAULT_LEVELS
  }
}

// shortcut: QR 세션 API가 없어 남은 시간을 고정값으로 보여준다, QR 발급 API를 붙일 때 서버 만료 시간으로 바꾼다.
const QR_SECONDS = 180

// 서버가 페이지 이미지로 바꿀 수 있는 사진 형식
const IMAGE_TYPES = ['image/jpeg', 'image/png']

/** AI 첨삭 1~2단계: 학습지 사진을 올리고(1) 확인한다(2). 파일 정보와 첨삭 영역도 여기서 정한다. */
export default function CorrectionUploadPage() {
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [levels, setLevels] = useState(loadLevels)
  const [qrOpen, setQrOpen] = useState(false)
  const [pages, setPages] = useState<PreviewPage[]>([])

  // 화면을 떠날 때 미리보기용 주소를 해제한다.
  const pagesRef = useRef(pages)
  useEffect(() => {
    pagesRef.current = pages
  }, [pages])
  useEffect(() => () => pagesRef.current.forEach((page) => URL.revokeObjectURL(page.url)), [])

  // shortcut: 업로드 API가 없어 브라우저 안에서만 미리 본다, 업로드 API를 붙일 때 서버에 올리고 업로드 중 상태를 켠다.
  const addFiles = (files: File[]) => {
    // 끌어다 놓기는 파일 선택 창의 형식 제한을 거치지 않으므로 여기서 사진만 남긴다.
    const images = files.filter((file) => IMAGE_TYPES.includes(file.type))
    setPages((prev) => [
      ...prev,
      ...images.map((file) => ({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file) })),
    ])
  }
  const removePage = (id: string) =>
    setPages((prev) => {
      const page = prev.find((item) => item.id === id)
      if (page) URL.revokeObjectURL(page.url)
      return prev.filter((item) => item.id !== id)
    })
  const clearPages = () =>
    setPages((prev) => {
      prev.forEach((page) => URL.revokeObjectURL(page.url))
      return []
    })
  const reviewing = pages.length > 0

  return (
    <div className="flex min-h-full max-w-[1120px] flex-col gap-ds-24 p-ds-40 font-sans">
      <header className="flex items-center justify-between gap-ds-24">
        <div className="flex flex-col gap-ds-16">
          <h1 className="text-h1 text-text-neutral-default">AI 첨삭</h1>
          <p className="text-body1-medium text-text-neutral-muted">학생의 글이 담긴 이미지나 스캔 파일을 업로드해주세요.</p>
        </div>
        <Stepper current={reviewing ? 2 : 1} className="shrink-0" />
      </header>

      <div className="flex h-[652px] gap-ds-24">
        {reviewing ? (
          <FilePreviewPanel className="min-w-px flex-1" pages={pages} onAddFiles={addFiles} onRemove={removePage} onClear={clearPages} />
        ) : (
          <FileDropzone className="min-w-px flex-1" onFilesSelected={addFiles} onQrUploadClick={() => setQrOpen(true)} />
        )}

        <aside aria-label="첨삭 설정" className="flex w-[400px] shrink-0 flex-col gap-ds-48 px-ds-24 pt-ds-24">
          <section className="flex flex-col gap-ds-24">
            <div className="flex flex-col gap-ds-4">
              <h2 className="text-h3 text-text-neutral-default">파일 설정</h2>
              <p className="text-body2-regular text-text-neutral-muted">파일의 제목과 저장할 학생을 선택하세요.</p>
            </div>
            <div className="flex flex-col gap-ds-16">
              <div className="flex items-center gap-ds-8">
                <span aria-hidden="true" className="w-[100px] text-label2-semibold text-text-neutral-muted">파일 제목</span>
                <TextField label="파일 제목" value={title} onValueChange={setTitle} />
              </div>
              <div className="flex items-center gap-ds-8">
                <span aria-hidden="true" className="w-[100px] text-label2-semibold text-text-neutral-muted">학생 선택</span>
                {/* shortcut: 학생 목록 API가 없어 빈 목록이다, 학생 관리 API를 붙일 때 options를 채운다. */}
                <Select label="학생 선택" options={[]} value={studentId} onValueChange={setStudentId} />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-ds-24">
            <div className="flex flex-col gap-ds-4">
              <h2 className="text-h3 text-text-neutral-default">첨삭 영역</h2>
              <p className="text-body2-regular text-text-neutral-muted">이전 첨삭에서 사용한 설정이 자동으로 적용돼요.</p>
            </div>
            <div className="flex flex-col gap-ds-16">
              {AREAS.map((area) => (
                <div key={area.id} className="flex items-center justify-between">
                  <span aria-hidden="true" className="text-label2-semibold whitespace-nowrap text-text-neutral-default">
                    {area.label}
                  </span>
                  <SegmentedControl<Level>
                    label={`${area.label} 첨삭 정도`}
                    value={levels[area.id]}
                    onValueChange={(level) => {
                      const next = { ...levels, [area.id]: level }
                      setLevels(next)
                      try {
                        localStorage.setItem(LEVELS_KEY, JSON.stringify(next))
                      } catch {
                        // 저장할 수 없어도 이번 화면에서는 고른 값을 쓴다.
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {reviewing && (
            <div className="mt-auto flex justify-end gap-ds-8">
              <button
                type="button"
                onClick={clearPages}
                className="rounded-ds-small border border-solid border-border-default bg-background-neutral-default px-ds-24 py-ds-8 text-label1-semibold text-text-neutral-default hover:bg-background-neutral-weak focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
              >
                취소
              </button>
              {/* shortcut: AI 첨삭 생성 단계가 아직 없어 누르면 아무 일도 없다, 생성 화면을 만들 때 연결한다. */}
              <ActionButton size="md">
                확인
              </ActionButton>
            </div>
          )}
        </aside>
      </div>

      <QrUploadModal open={qrOpen} onClose={() => setQrOpen(false)} remainingSeconds={QR_SECONDS} onRefresh={() => {}} />
    </div>
  )
}
