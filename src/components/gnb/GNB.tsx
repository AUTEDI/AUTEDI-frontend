import type { ComponentPropsWithRef } from 'react'

export type GNBProps = Omit<ComponentPropsWithRef<'header'>, 'children'> & {
  academyName?: string
  userName?: string
}

export default function GNB({
  academyName = '학원명',
  userName = '접속자명',
  className = '',
  'aria-label': ariaLabel = '사용자 정보',
  ...props
}: GNBProps) {
  return (
    <header
      {...props}
      aria-label={ariaLabel}
      className={`sticky top-0 z-20 flex h-ds-60 w-full shrink-0 items-center justify-end border-b border-solid border-border-weak bg-background-neutral-default px-ds-32 font-sans ${className}`}
    >
      <div className="flex min-w-0 max-w-full items-center gap-ds-8">
        <span aria-hidden="true" className="size-ds-24 shrink-0 rounded-ds-full bg-background-brand-subtle" />
        <p className="flex min-w-0 items-center gap-ds-4 text-label2-medium text-text-neutral-muted">
          <span className="min-w-0 truncate" title={academyName}>
            <span className="sr-only">학원: </span>
            {academyName}
          </span>
          <span aria-hidden="true" className="shrink-0 text-text-neutral-subtle">|</span>
          <span className="min-w-0 truncate" title={userName}>
            <span className="sr-only">접속자: </span>
            {userName}
          </span>
        </p>
      </div>
    </header>
  )
}
