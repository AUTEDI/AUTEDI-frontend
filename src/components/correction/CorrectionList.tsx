import type { Correction } from '../../types/correction'
import CorrectionListRow from './CorrectionListRow'

export type CorrectionListProps = {
  items: readonly Correction[]
  caption?: string
  emptyMessage?: string
  variant?: 'default' | 'home'
}

export default function CorrectionList({
  items,
  caption = '첨삭 이력 목록',
  emptyMessage = '첨삭 이력이 존재하지 않아요',
  variant = 'default',
}: CorrectionListProps) {
  const columnClassName = variant === 'home' ? 'w-[225px]' : 'w-[22%]'

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1024px] table-fixed border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col className={columnClassName} />
          <col className={columnClassName} />
          <col className={columnClassName} />
          <col className={columnClassName} />
          <col className={variant === 'home' ? undefined : 'w-[12%]'} />
        </colgroup>
        <thead>
          <tr className="h-ds-48 border-b border-border-neutral-default text-label3-semibold text-text-neutral-default">
            {['제목', '상태', '학생', '담당 선생님', '작성일'].map((label) => (
              <th key={label} scope="col" className={variant === 'home' ? 'p-0 font-semibold' : 'p-0 py-ds-16 font-semibold'}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? items.map((correction) => (
            <CorrectionListRow key={correction.id} correction={correction} />
          )) : (
            <tr className={variant === 'home' ? 'h-[180px]' : 'h-ds-60'}>
              <td colSpan={5} className="p-0 text-center text-body2-regular text-text-neutral-subtle">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
