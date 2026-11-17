import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { createGeneration } from '../../apis/generations'
import { createWorksheet, getWorksheetFile, saveWorksheetSettings, type CorrectionArea } from '../../apis/worksheets'
import ActionButton from '../../components/common/ActionButton'
import { photoError } from '../../utils/photo'
import SegmentedControl from '../../components/common/SegmentedControl'
import Select from '../../components/common/Select'
import TextField from '../../components/common/TextField'
import CorrectionLayout from './components/CorrectionLayout'
import FileDropzone from './components/FileDropzone'
import FilePreviewPanel, { type PreviewPage } from './components/FilePreviewPanel'
import GenerationProgress, { type GenerationJob } from './components/GenerationProgress'
import QrUploadModal from './components/QrUploadModal'

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

/** 페이지 목록 하나를 학습지로 올리는 작업 */
type Upload = { pages: UploadPage[]; worksheetId: Promise<number>; controller: AbortController; failed: boolean }

const UPLOAD_DELAY_MS = 800

// shortcut: 페이지가 바뀌어 버린 이전 업로드는 서버에 임시(DRAFT) 학습지로 남는다, 학습지 삭제 API가 생기면 지운다.
function startUpload(pages: UploadPage[]): Upload {
  const controller = new AbortController()
  // 휴대폰 사진 한 장뿐이면 휴대폰이 이미 만든 학습지를 쓰고, 노트북 사진이 섞이면 전부 새 학습지로 올린다.
  const phoneWorksheetId = pages.length === 1 ? pages[0].worksheetId : undefined
  const worksheetId =
    phoneWorksheetId !== undefined ? Promise.resolve(phoneWorksheetId)
    : createWorksheet(pages.map((page) => page.file), controller.signal)
  const upload: Upload = { pages, worksheetId, controller, failed: false }
  // 미리 올리기 실패는 확인을 누를 때 다시 올리며 알리므로 여기서는 표시만 해 둔다.
  worksheetId.catch(() => {
    upload.failed = true
  })
  return upload
}

/** AI 첨삭 1~3단계: 학습지 사진을 올리고(1) 확인한 뒤(2) 첨삭 생성을 기다린다(3). 파일 정보와 첨삭 영역도 여기서 정한다. */
export default function CorrectionUploadPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [levels, setLevels] = useState(loadLevels)
  const [qrOpen, setQrOpen] = useState(false)
  const [pages, setPages] = useState<UploadPage[]>([])
  const [uploadError, setUploadError] = useState('')
  // 확인(업로드·설정 저장) 실패. 재업로드 버튼이 파일을 새로 고르지 않고 같은 페이지로 다시 시도한다.
  const [confirmError, setConfirmError] = useState('')
  const [receivingPhone, setReceivingPhone] = useState(false)
  // 확인을 누르면 바로 3단계(AI 첨삭 중) 화면으로 넘어간다. 생성 요청이 접수되기 전에는 'preparing'이다.
  const [generating, setGenerating] = useState<GenerationJob | 'preparing' | null>(null)
  const uploadRef = useRef<Upload | null>(null)
  const confirmAbortRef = useRef<AbortController | null>(null)

  // 화면을 떠날 때 미리보기용 주소를 해제하고 올리던 학습지는 멈춘다.
  const pagesRef = useRef(pages)
  useEffect(() => {
    pagesRef.current = pages
  }, [pages])
  useEffect(
    () => () => {
      pagesRef.current.forEach((page) => URL.revokeObjectURL(page.url))
      uploadRef.current?.controller.abort()
      confirmAbortRef.current?.abort()
    },
    [],
  )

  // 사진을 고르면 확인을 누르기 전부터 미리 올린다. 이미 만든 학습지에 사진을 덧붙이는 API가 없어,
  // 페이지가 바뀌면 바뀐 목록 전체로 다시 올린다. 연달아 바뀔 때마다 올리지 않도록 잠시 기다린다.
  useEffect(() => {
    if (pages.length === 0) {
      uploadRef.current?.controller.abort()
      uploadRef.current = null
      return
    }
    const timer = setTimeout(() => {
      if (uploadRef.current?.pages === pages) return
      uploadRef.current?.controller.abort()
      uploadRef.current = startUpload(pages)
    }, UPLOAD_DELAY_MS)
    return () => clearTimeout(timer)
  }, [pages])

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
    // 사진을 받는 동안 빈 화면 대신 올리는 중 안내를 보여준다.
    setReceivingPhone(true)
    try {
      const file = await getWorksheetFile(worksheetId)
      setPages((prev) => [
        ...prev,
        { id: `worksheet-${worksheetId}`, name: '휴대폰 사진', url: URL.createObjectURL(file), file, worksheetId },
      ])
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : '휴대폰에서 올린 사진을 불러오지 못했어요.')
    } finally {
      setReceivingPhone(false)
    }
  }
  // 확인: 바로 AI 첨삭 중 화면으로 넘어가고, 미리 올리던 학습지를 기다린 뒤 설정을 저장하고 생성을 요청한다.
  const confirm = async () => {
    const controller = new AbortController()
    confirmAbortRef.current = controller
    setConfirmError('')
    setGenerating('preparing')
    try {
      let upload = uploadRef.current
      // 아직 안 올렸거나(대기 중), 목록이 바뀌었거나, 미리 올리기가 실패했으면 지금 올린다.
      if (!upload || upload.pages !== pages || upload.failed) {
        upload?.controller.abort()
        upload = startUpload(pages)
        uploadRef.current = upload
      }
      const worksheetId = await upload.worksheetId
      await saveWorksheetSettings(
        worksheetId,
        AREAS.map(({ id: key, area }) => ({ area, level: levels[key] === 'advanced' ? 'ADVANCED' : 'STANDARD' })),
        controller.signal,
      )
      const generation = await createGeneration(worksheetId, crypto.randomUUID(), controller.signal)
      if (!controller.signal.aborted) setGenerating({ worksheetId, generation })
    } catch (error) {
      if (controller.signal.aborted) return
      setGenerating(null)
      setConfirmError(error instanceof Error ? error.message : '학습지를 올리지 못했어요. 다시 시도해 주세요.')
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
    <CorrectionLayout step={generating ? 3 : reviewing ? 2 : 1}>
      <div className="flex h-[652px] gap-ds-24">
        {generating ? (
          <GenerationProgress
            // 생성 요청이 접수되면 새 작업을 따라가도록 다시 그린다.
            key={generating === 'preparing' ? 'preparing' : generating.generation.id}
            className="min-w-px flex-1"
            job={generating === 'preparing' ? null : generating}
            // shortcut: 생성 작업을 멈추는 API가 없어 화면만 2단계로 돌아가고 서버 작업은 계속된다, 취소 API가 생기면 함께 부른다.
            onCancel={() => {
              confirmAbortRef.current?.abort()
              setGenerating(null)
            }}
            onSucceeded={(worksheetId) => navigate(`/corrections/review/${worksheetId}`)}
          />
        ) : receivingPhone ? (
          <FileDropzone className="min-w-px flex-1" uploading onFilesSelected={addFiles} onQrUploadClick={() => setQrOpen(true)} />
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

        <aside aria-label="첨삭 설정" hidden={!!generating} className="flex w-[400px] shrink-0 flex-col gap-ds-48 px-ds-24 pt-ds-24">
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
              <ActionButton size="md" variant="secondary" onClick={clearPages}>
                취소
              </ActionButton>
              <ActionButton size="md" onClick={confirm}>
                확인
              </ActionButton>
            </div>
          )}
        </aside>
      </div>

      <QrUploadModal open={qrOpen} onClose={() => setQrOpen(false)} onUploaded={addPhoneUpload} />
    </CorrectionLayout>
  )
}
