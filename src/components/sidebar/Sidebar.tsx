import { useId, useState, type ComponentPropsWithRef } from 'react'
import { Link, type To } from 'react-router'
import logo from '../../assets/design-system/sidebar-logo.svg'
import toggleIcon from '../../assets/design-system/sidebar-toggle.svg'
import SidebarItem from './SidebarItem'
import { sidebarItems, type SidebarMenuItem } from './sidebarItems'

export type SidebarProps = Omit<ComponentPropsWithRef<'aside'>, 'children'> & {
  items?: readonly SidebarMenuItem[]
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  logoTo?: To
  onLogout?: () => void
  isLoggingOut?: boolean
  logoutError?: string
}

const focusClasses = 'rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-brand-focus'
const labelTransitionClasses = 'pointer-events-none absolute inset-y-0 left-ds-32 flex items-center whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none'

export default function Sidebar({
  items = sidebarItems,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  logoTo = '/main',
  onLogout,
  isLoggingOut = false,
  logoutError = '',
  className = '',
  'aria-label': ariaLabel = '사이드바',
  ...props
}: SidebarProps) {
  const navigationId = useId()
  const logoutErrorId = useId()
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const isCollapsed = collapsed ?? internalCollapsed
  const toggleLabel = isCollapsed ? '사이드바 펼치기' : '사이드바 접기'

  function toggleCollapsed() {
    const nextCollapsed = !isCollapsed
    if (collapsed === undefined) setInternalCollapsed(nextCollapsed)
    onCollapsedChange?.(nextCollapsed)
  }

  return (
    <aside
      {...props}
      aria-label={ariaLabel}
      data-collapsed={isCollapsed}
      className={[
        'flex h-dvh shrink-0 flex-col bg-background-neutral-weak font-sans transition-[width] duration-300 ease-in-out motion-reduce:transition-none',
        isCollapsed ? 'w-ds-sidebar-folded' : 'w-ds-sidebar-expanded',
        className,
      ].join(' ')}
    >
      <div className={`flex h-ds-60 shrink-0 items-center ${isCollapsed ? 'px-[22px]' : 'px-ds-24'}`}>
        <Link to={logoTo} aria-label="AUTEDI 홈으로 이동" title={isCollapsed ? 'AUTEDI' : undefined} className={`relative inline-flex w-full min-w-0 items-center overflow-hidden ${focusClasses}`}>
          <img src={logo} alt="" width="28" height="28" className="shrink-0" />
          <span aria-hidden="true" className={`font-brand text-[22px] leading-[1.5] font-extrabold text-text-brand-strong ${labelTransitionClasses} ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>AUTEDI</span>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-ds-24 py-ds-16">
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          aria-expanded={!isCollapsed}
          aria-controls={navigationId}
          className={`inline-flex size-ds-24 shrink-0 cursor-pointer items-center justify-center ${focusClasses}`}
          onClick={toggleCollapsed}
        >
          <img src={toggleIcon} alt="" width="19.6" height="15.1" className="max-w-none" />
        </button>
        <nav id={navigationId} aria-label="주 메뉴" className="mt-ds-24 min-h-0 w-[calc(100%+var(--spacing-16))] flex-1 self-center overflow-x-hidden overflow-y-auto p-ds-8">
          <ul className="flex flex-col gap-ds-32">
            {items.map(({ id, label, ...item }) => (
              <li key={id} className="shrink-0">
                <SidebarItem {...item} collapsed={isCollapsed}>{label}</SidebarItem>
              </li>
            ))}
          </ul>
        </nav>
        <button
          type="button"
          onClick={onLogout}
          disabled={!onLogout || isLoggingOut}
          aria-label={isLoggingOut ? '로그아웃 중' : '로그아웃'}
          aria-busy={isLoggingOut}
          aria-describedby={logoutError ? logoutErrorId : undefined}
          title={isCollapsed ? logoutError || '로그아웃' : undefined}
          className={[
            'relative mt-ds-16 inline-flex min-h-ds-24 w-full shrink-0 cursor-pointer items-center overflow-hidden text-label2-semibold text-text-neutral-subtle hover:text-text-neutral-default disabled:cursor-not-allowed disabled:opacity-50',
            focusClasses,
          ].join(' ')}
        >
          <span aria-hidden="true" className="inline-flex size-ds-24 shrink-0 items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </span>
          <span aria-hidden="true" className={`${labelTransitionClasses} ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </span>
        </button>
        {logoutError && (
          <p id={logoutErrorId} role="alert" className={isCollapsed ? 'sr-only' : 'mt-ds-8 shrink-0 break-words text-caption text-text-accent-red'}>
            {logoutError}
          </p>
        )}
      </div>
    </aside>
  )
}
