import type { Correction, CorrectionStatus } from '../../types/correction'

export type HistoryFilterValues = {
  query: string
  status: CorrectionStatus | ''
  studentId: string
  teacherId: string
  sort: '' | 'oldest'
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilterValues = {
  query: '', status: '', studentId: '', teacherId: '', sort: '',
}

const normalize = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase()

export function filterCorrectionHistory(items: readonly Correction[], filters: HistoryFilterValues): Correction[] {
  const query = normalize(filters.query)
  return items
    .filter((item) =>
      (!filters.status || item.status === filters.status)
      && (!filters.studentId || item.student.id === filters.studentId)
      && (!filters.teacherId || item.teacher.id === filters.teacherId)
      && (!query || [item.title, item.student.name, item.teacher.name].some(value => normalize(value).includes(query))),
    )
    .sort((a, b) => filters.sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt))
}
