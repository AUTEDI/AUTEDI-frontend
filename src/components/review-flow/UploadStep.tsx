import { SAMPLE_WORKSHEET_URL } from '../../constants/sampleReview'
import { useAppStore } from '../../stores/useAppStore'
import type { FeedbackSetting } from '../../types/review'
import { cn } from '../../utils/cn'
import { Button } from '../common/Button'
import { PresetList } from '../common/PresetList'
import { Dropzone } from './Dropzone'
import { FlowActions } from './FlowActions'
import { UploadPreview } from './UploadPreview'

function SampleUploadButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-[10px] rounded-xl bg-navy px-3 py-[10px] text-left text-white disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="size-[43px] flex-none overflow-hidden rounded-lg bg-white">
        <img alt="예시 손글씨 학습지" className="size-full bg-white object-contain" src={SAMPLE_WORKSHEET_URL} />
      </span>
      <div className="grid gap-[3px]">
        <b className="text-[9px]">예시 학습지로 바로 체험하기</b>
        <small className="text-[7px] text-[#aeb4ca]">실제 손글씨 사진 위 첨삭 흐름을 확인해보세요.</small>
      </div>
      <em className="ml-auto text-[8px] text-[#aab2ff]">사용하기 →</em>
    </button>
  )
}

function AppliedSettingsCard({ settings, onChange, disabled }: { settings: FeedbackSetting[]; onChange: () => void; disabled: boolean }) {
  return (
    <aside className="rounded-[18px] border border-line bg-white p-6 shadow-card max-sm:mt-3">
      <div className="flex items-start justify-between">
        <h2 className="my-1.5 text-[18px]">이번 첨삭 설정</h2>
        <span className="rounded-md bg-[#eceaff] px-[7px] py-[5px] text-[7px] text-[#5b58c8]">기본 설정</span>
      </div>
      <p className="mt-px mb-[17px] text-[9px] text-[#8a8fa0]">저장된 기본 설정이 자동으로 적용됩니다.</p>
      <PresetList className="my-5" settings={settings} />
      <Button className="w-full disabled:opacity-50" disabled={disabled} onClick={onChange}>
        이번 첨삭에서만 변경
      </Button>
      <div className="mt-3 text-center text-[7px] text-[#9b9fac]">
        학생 실력 등급이 아닌, AI가 원문에 개입하는 정도입니다.
      </div>
    </aside>
  )
}

type UploadStepProps = {
  onCustomize: () => void
  onStart: () => void
}

export function UploadStep({ onCustomize, onStart }: UploadStepProps) {
  const uploads = useAppStore((state) => state.uploads)
  const activeUploadId = useAppStore((state) => state.activeUploadId)
  const selectUpload = useAppStore((state) => state.selectUpload)
  const defaults = useAppStore((state) => state.defaults)
  const uploading = useAppStore((state) => state.uploading)
  const loadFiles = useAppStore((state) => state.loadFiles)
  const loadSample = useAppStore((state) => state.loadSample)
  const removeFile = useAppStore((state) => state.removeFile)
  const navigate = useAppStore((state) => state.navigate)

  return (
    <div className="grid animate-fade-step grid-cols-[minmax(0,1fr)_355px] gap-[18px] max-md:grid-cols-[minmax(0,1fr)_310px] max-sm:block">
      <div
        className={cn(
          'grid min-h-[515px] min-w-0 gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card max-sm:min-h-[420px]',
          uploads.length ? 'grid-rows-[1fr]' : 'grid-rows-[1fr_auto_auto]',
        )}
      >
        {uploads.length ? (
          <UploadPreview
            uploads={uploads}
            activeUploadId={activeUploadId}
            uploading={uploading}
            onSelect={selectUpload}
            onRemove={removeFile}
            onFiles={(files) => void loadFiles(files)}
          />
        ) : (
          <>
            <Dropzone onFiles={(files) => void loadFiles(files)} uploading={uploading} />
            <SampleUploadButton disabled={uploading} onClick={() => void loadSample()} />
          </>
        )}
      </div>
      <AppliedSettingsCard disabled={uploading} onChange={onCustomize} settings={defaults} />
      {uploads.length > 1 && <p className="col-span-full text-[10px] text-[#8a8fa0]">현재 미리보기 중인 파일을 첨삭합니다.</p>}
      <FlowActions>
        <Button onClick={() => navigate('home')}>취소</Button>
        <Button disabled={!uploads.length || uploading} onClick={onStart} variant="primary">
          {uploads.length > 1 ? '선택한 파일 첨삭 시작' : '기본 설정으로 첨삭 시작'} <b className="ml-2">✦</b>
        </Button>
      </FlowActions>
    </div>
  )
}
