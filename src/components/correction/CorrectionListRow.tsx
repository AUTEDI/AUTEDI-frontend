import type { Correction, CorrectionPerson, CorrectionStatus } from '../../types/correction'

const statusLabels: Record<CorrectionStatus, string> = {
  draft: '임시 저장',
  completed: '첨삭 완료',
}

function PersonCell({ person }: { person: CorrectionPerson }) {
  const initial = Array.from(person.name.trim())[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex min-w-0 items-center gap-ds-8 pr-ds-12">
      <span
        aria-hidden="true"
        className="flex size-[28px] shrink-0 items-center justify-center rounded-ds-full bg-icon-neutral-weak text-label3-medium text-icon-neutral-muted"
      >
        {initial}
      </span>
      <span className="truncate" title={person.name}>{person.name}</span>
    </div>
  )
}

export default function CorrectionListRow({ correction }: { correction: Correction }) {
  return (
    <tr className="h-ds-60 border-b border-border-weak text-caption text-text-neutral-muted">
      <td className="p-0 pr-ds-12 text-body2-medium text-text-neutral-default">
        <span className="block truncate" title={correction.title}>{correction.title}</span>
      </td>
      <td className="p-0">{statusLabels[correction.status]}</td>
      <td className="p-0"><PersonCell person={correction.student} /></td>
      <td className="p-0"><PersonCell person={correction.teacher} /></td>
      <td className="whitespace-nowrap p-0">
        <time dateTime={correction.createdAt}>{correction.createdAt.replaceAll('-', '.')}</time>
      </td>
    </tr>
  )
}
