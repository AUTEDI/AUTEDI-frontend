import { useEffect, useRef, useState } from 'react'
import { createWorksheet, getWorksheetFile, saveWorksheetSettings, type CorrectionArea } from '../../apis/worksheets'
import ActionButton from '../../components/common/ActionButton'
import { photoError } from '../../utils/photo'
import SegmentedControl from '../../components/common/SegmentedControl'
import Select from '../../components/common/Select'
import TextField from '../../components/common/TextField'
import FileDropzone from './components/FileDropzone'
import FilePreviewPanel, { type PreviewPage } from './components/FilePreviewPanel'
import QrUploadModal from './components/QrUploadModal'
import Stepper from './components/Stepper'

type Level = 'standard' | 'advanced'

const AREAS = [
  { id: 'grammar', area: 'GRAMMAR_SPELLING', label: '문법 및 철자' },
  { id: 'vocabulary', area: 'VOCABULARY_EXPRESSION', label: '어휘 및 표현' },
  { id: 'structure', area: 'SENTENCE_STRUCTURE', label: '문장 구성' },
  { id: 'content', area: 'CONTENT_SUMMARY', label: '내용 및 요약' },
] as const satisfies readonly { id: string; area: CorrectionArea; label: string }[]

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

/** 올릴 파일과, 휴대폰이 이미 만든 학습지라면 그 ID */
type UploadPage = PreviewPage & { file: File; worksheetId?: number }

/** AI 첨삭 1~2단계: 학습지 사진을 올리고(1) 확인한다(2). 파일 정보와 첨삭 영역도 여기서 정한다. */
export default function CorrectionUploadPage() {
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [levels, setLevels] = useState(loadLevels)
  const [qrOpen, setQrOpen] = useState(false)
  const [pages, setPages] = useState<UploadPage[]>([])
  const [uploadError, setUploadError] = useState('')
  // 확인(업로드·설정 저장) 실패. 재업로드 버튼이 파일을 새로 고르지 않고 같은 페이지로 다시 시도한다.
  const [confirmError, setConfirmError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 마지막으로 저장한 학습지. 페이지 목록이 그대로면 다시 올리지 않고 설정만 다시 저장한다.
  // levels가 null이면 학습지만 올라가고 설정 저장은 아직 못 한 상태다.
  const [savedWorksheet, setSavedWorksheet] = useState<{ id: number; pages: UploadPage[]; levels: Levels | null } | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)
  const saved = savedWorksheet?.pages === pages && savedWorksheet.levels === levels

  // 화면을 떠날 때 미리보기용 주소를 해제한다.
  const pagesRef = useRef(pages)
  useEffect(() => {
    pagesRef.current = pages
  }, [pages])
  useEffect(() => () => pagesRef.current.forEach((page) => URL.revokeObjectURL(page.url)), [])

  // 이미 만든 학습지에 사진을 덧붙이는 API가 없어, 고른 사진은 확인을 누를 때 한 번에 올린다.
  const addFiles = (files: File[]) => {
    // 끌어다 놓기는 파일 선택 창의 형식 제한을 거치지 않으므로 여기서 형식·용량을 다시 본다.
    setConfirmError('')
    const error = files.map(photoError).find(Boolean)
    if (error) {
      setUploadError(error)
      return
    }
    setUploadError('')
    setPages((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file), file })),
    ])
  }
  // 휴대폰이 QR로 사진을 올리면 새 학습지가 생기고, 그 사진을 불러와 확인 단계에 붙인다.
  const addPhoneUpload = async (worksheetId: number) => {
    setQrOpen(false)
    try {
      const file = await getWorksheetFile(worksheetId)
      setPages((prev) => [
        ...prev,
        { id: `worksheet-${worksheetId}`, name: '휴대폰 사진', url: URL.createObjectURL(file), file, worksheetId },
      ])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '휴대폰에서 올린 사진을 불러오지 못했어요.')
    }
  }
  const confirm = async () => {
    if (submitting) return
    const controller = new AbortController()
    uploadAbortRef.current = controller
    setSubmitting(true)
    setConfirmError('')
    try {
      // 휴대폰 사진 한 장뿐이면 이미 만들어진 학습지를 쓰고, 노트북 사진이 섞이면 전부 새 학습지로 올린다.
      const phoneWorksheetId = pages.length === 1 ? pages[0].worksheetId : undefined
      const id =
        savedWorksheet?.pages === pages ? savedWorksheet.id
        : (phoneWorksheetId ?? (await createWorksheet(pages.map((page) => page.file), controller.signal)))
      // 설정 저장이 실패해도 다시 확인을 누를 때 학습지를 또 만들지 않도록 먼저 기록한다.
      setSavedWorksheet({ id, pages, levels: null })
      await saveWorksheetSettings(
        id,
        AREAS.map(({ id: key, area }) => ({ area, level: levels[key] === 'advanced' ? 'ADVANCED' : 'STANDARD' })),
        controller.signal,
      )
      setSavedWorksheet({ id, pages, levels })
    } catch (error) {
      if (!controller.signal.aborted) {
        setConfirmError(error instanceof Error ? error.message : '학습지를 올리지 못했어요. 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }
  const removePage = (id: string) =>
    setPages((prev) => {
      const page = prev.find((item) => item.id === id)
      if (page) URL.revokeObjectURL(page.url)
      return prev.filter((item) => item.id !== id)
    })
  const clearPages = () => {
    setConfirmError('')
    setPages((prev) => {
      prev.forEach((page) => URL.revokeObjectURL(page.url))
      return []
    })
  }
  const reviewing = pages.length > 0

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col gap-ds-24 py-ds-40 pr-[120px] pl-ds-40 font-sans">
      <header className="flex items-center justify-between gap-ds-24">
        <div className="flex flex-col gap-ds-16">
          <h1 className="text-h1 text-text-neutral-default">AI 첨삭</h1>
          <p className="text-body1-medium text-text-neutral-muted">학생의 글이 담긴 이미지나 스캔 파일을 업로드해주세요.</p>
        </div>
        <Stepper current={reviewing ? 2 : 1} className="shrink-0" />
      </header>

      <div className="flex h-[652px] gap-ds-24">
        {submitting ? (
          <FileDropzone
            className="min-w-px flex-1"
            uploading
            onCancelUpload={() => uploadAbortRef.current?.abort()}
            onFilesSelected={addFiles}
            onQrUploadClick={() => setQrOpen(true)}
          />
        ) : confirmError ? (
          <FileDropzone
            className="min-w-px flex-1"
            error={confirmError}
            onDismissError={() => setConfirmError('')}
            onRetry={confirm}
            onFilesSelected={addFiles}
            onQrUploadClick={() => setQrOpen(true)}
          />
        ) : uploadError ? (
          <FileDropzone
            className="min-w-px flex-1"
            error={uploadError}
            onDismissError={() => setUploadError('')}
            onFilesSelected={addFiles}
            onQrUploadClick={() => setQrOpen(true)}
          />
        ) : reviewing ? (
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
                {/* shortcut: 학습지 API에 제목 필드가 없어 화면에만 둔다, 백엔드에 필드가 생기면 업로드 때 함께 보낸다. */}
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
            <div className="mt-auto flex items-center justify-end gap-ds-8">
              {saved && (
                <p role="status" className="mr-auto text-body2-regular text-text-neutral-muted">
                  학습지와 첨삭 영역을 저장했어요.
                </p>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={clearPages}
                className="rounded-ds-small border border-solid border-border-default bg-background-neutral-default px-ds-24 py-ds-8 text-label1-semibold text-text-neutral-default hover:bg-background-neutral-weak focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
              >
                취소
              </button>
              {/* shortcut: AI 첨삭 생성 단계가 아직 없어 학습지와 설정 저장까지만 한다, 생성 화면을 만들 때 저장 후 생성 요청으로 넘어간다. */}
              <ActionButton size="md" disabled={submitting || saved} onClick={confirm}>
                확인
              </ActionButton>
            </div>
          )}
        </aside>
      </div>

      <QrUploadModal open={qrOpen} onClose={() => setQrOpen(false)} onUploaded={addPhoneUpload} />
    </div>
  )
}
