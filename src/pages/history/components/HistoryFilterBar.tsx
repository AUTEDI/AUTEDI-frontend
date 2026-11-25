import SearchBar from '../../../components/common/SearchBar'
import Select from '../../../components/common/Select'
import type { Correction } from '../../../types/correction'
import type { HistoryFilterValues } from '../historyFilters'

type HistoryFilterBarProps = {
  items: readonly Correction[]
  searchInput: string
  onSearchInputChange: (value: string) => void
  onSearch: () => void
  filters: HistoryFilterValues
  onFiltersChange: (filters: HistoryFilterValues) => void
}

export default function HistoryFilterBar({ items, searchInput, onSearchInputChange, onSearch, filters, onFiltersChange }: HistoryFilterBarProps) {
  const students = [...new Map(items.map(item => [item.student.id, item.student])).values()]
  const teachers = [...new Map(items.map(item => [item.teacher.id, item.teacher])).values()]

  return (
    <div className="flex flex-wrap items-center justify-between gap-ds-24">
      <SearchBar value={searchInput} onValueChange={onSearchInputChange} onSearch={onSearch} label="첨삭 제목, 학생, 담당 선생님 검색" />
      <div role="group" aria-label="첨삭 이력 필터" className="flex flex-wrap items-center gap-ds-10">
        <Select
          variant="filter"
          label="상태"
          placeholder="상태"
          options={[{ value: '', label: '전체' }, { value: 'completed', label: '첨삭 완료' }, { value: 'draft', label: '임시 저장' }]}
          value={filters.status}
          onValueChange={value => onFiltersChange({ ...filters, status: value as HistoryFilterValues['status'] })}
        />
        <Select
          variant="filter"
          label="학생"
          placeholder="학생"
          options={[{ value: '', label: '전체' }, ...students.map(student => ({ value: student.id, label: student.name }))]}
          value={filters.studentId}
          onValueChange={studentId => onFiltersChange({ ...filters, studentId })}
        />
        <Select
          variant="filter"
          label="담당 선생님"
          placeholder="담당 선생님"
          options={[{ value: '', label: '전체' }, ...teachers.map(teacher => ({ value: teacher.id, label: teacher.name }))]}
          value={filters.teacherId}
          onValueChange={teacherId => onFiltersChange({ ...filters, teacherId })}
        />
        <Select
          variant="filter"
          label="작성일"
          placeholder="작성일"
          options={[{ value: '', label: '최신순' }, { value: 'oldest', label: '오래된순' }]}
          value={filters.sort}
          onValueChange={value => onFiltersChange({ ...filters, sort: value as HistoryFilterValues['sort'] })}
        />
      </div>
    </div>
  )
}
