import { Link } from 'react-router'
import chevronRight from '../../../assets/design-system/a1a28.svg'
import CorrectionList from '../../../components/correction/CorrectionList'
import type { Correction } from '../../../types/correction'

const RECENT_CORRECTION_LIMIT = 5

export default function RecentCorrections({ items }: { items: readonly Correction[] }) {
  return (
    <section aria-labelledby="recent-corrections-heading" className="flex flex-col gap-ds-24">
      <div className="flex items-center justify-between gap-ds-16">
        <h2 id="recent-corrections-heading" className="text-h3 text-text-neutral-muted">최근 첨삭 이력</h2>
        <Link
          to="/correction-history"
          className="inline-flex shrink-0 items-center gap-ds-4 rounded-ds-small text-body2-regular text-text-neutral-subtle hover:text-text-neutral-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused"
        >
          전체 보기
          <span
            aria-hidden="true"
            className="size-ds-16 shrink-0 bg-current mask-center mask-no-repeat"
            style={{ maskImage: `url("${chevronRight}")` }}
          />
        </Link>
      </div>
      <CorrectionList
        variant="home"
        items={items.slice(0, RECENT_CORRECTION_LIMIT)}
        caption="최근 첨삭 이력 최대 5건"
        emptyMessage="최근 첨삭 이력이 존재하지 않아요"
      />
    </section>
  )
}
