import CorrectionList from '../../components/correction/CorrectionList'
import { mockCorrections } from '../../mocks/corrections'

export default function CorrectionHistoryPage() {
  return (
    <div className="flex flex-col gap-ds-24 px-ds-48 py-ds-40">
      <div className="flex flex-wrap items-center gap-ds-12">
        <h2 className="text-h2 text-text-neutral-default">첨삭 이력</h2>
        <span className="text-body2-regular text-text-neutral-muted">전체 {mockCorrections.length}건</span>
      </div>
      <CorrectionList items={mockCorrections} caption="전체 첨삭 이력" />
    </div>
  )
}
