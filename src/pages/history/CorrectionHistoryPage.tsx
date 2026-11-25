import { useState } from 'react'
import CorrectionList from '../../components/correction/CorrectionList'
import { mockCorrections } from '../../mocks/corrections'
import HistoryFilterBar from './components/HistoryFilterBar'
import { DEFAULT_HISTORY_FILTERS, filterCorrectionHistory } from './historyFilters'

export default function CorrectionHistoryPage() {
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState(DEFAULT_HISTORY_FILTERS)
  const filteredItems = filterCorrectionHistory(mockCorrections, filters)

  return (
    <div className="flex min-w-0 flex-col gap-ds-40 pt-ds-40 pr-[120px] pb-ds-48 pl-ds-48">
      <div className="flex flex-wrap items-center gap-ds-12">
        <h1 className="text-h1 text-text-neutral-default">첨삭 이력</h1>
        <span className="text-body1-medium text-text-neutral-muted">전체 {mockCorrections.length}건</span>
      </div>
      <HistoryFilterBar
        items={mockCorrections}
        searchInput={searchInput}
        onSearchInputChange={(value) => {
          setSearchInput(value)
          if (!value) setFilters(previous => ({ ...previous, query: '' }))
        }}
        onSearch={() => setFilters(previous => ({ ...previous, query: searchInput }))}
        filters={filters}
        onFiltersChange={setFilters}
      />
      <p role="status" className="sr-only">검색 결과 {filteredItems.length}건</p>
      <CorrectionList items={filteredItems} variant="history" caption="첨삭 이력 검색 결과" emptyMessage="해당하는 첨삭 기록이 존재하지 않아요" />
    </div>
  )
}
