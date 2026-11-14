import { Link } from 'react-router'
import CorrectionList from '../../../components/correction/CorrectionList'
import type { Correction } from '../../../types/correction'

const RECENT_CORRECTION_LIMIT = 5

export default function RecentCorrections({ items }: { items: readonly Correction[] }) {
  return (
    <section aria-labelledby="recent-corrections-heading" className="flex flex-col gap-ds-24">
      <div className="flex items-center justify-between gap-ds-16">
        <h2 id="recent-corrections-heading" className="text-h3 text-text-neutral-default">최근 첨삭 이력</h2>
        <Link
          to="/correction-history"
          className="shrink-0 rounded-ds-small text-body2-medium text-text-neutral-muted hover:text-text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused"
        >
          전체보기
        </Link>
      </div>
      <CorrectionList
        items={items.slice(0, RECENT_CORRECTION_LIMIT)}
        caption="최근 첨삭 이력 최대 5건"
        emptyMessage="최근 첨삭 이력이 존재하지 않아요"
      />
    </section>
  )
}
