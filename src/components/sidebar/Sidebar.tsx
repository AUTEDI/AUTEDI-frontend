import { useId, useState, type ComponentPropsWithRef } from 'react'
import { Link, type To } from 'react-router'
import logo from '../../assets/design-system/sidebar-logo.svg'
import toggleIcon from '../../assets/design-system/sidebar-toggle.svg'
import helpIcon from '../../assets/design-system/sidebar-help.svg'
import SidebarItem from './SidebarItem'
import { sidebarItems, type SidebarMenuItem } from './sidebarItems'

export type SidebarProps = Omit<ComponentPropsWithRef<'aside'>, 'children'> & {
  items?: readonly SidebarMenuItem[]
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  logoTo?: To
  helpTo?: To
}

const focusClasses = 'rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused'
const labelTransitionClasses = 'min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,max-height,opacity,transform] duration-300 ease-in-out motion-reduce:transition-none'

export default function Sidebar({
  items = sidebarItems,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  logoTo = '/',
  helpTo = '/help',
  className = '',
  'aria-label': ariaLabel = '사이드바',
  ...props
}: SidebarProps) {
  const navigationId = useId()
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
      <div className={`flex h-ds-60 shrink-0 items-center transition-[padding] duration-300 ease-in-out motion-reduce:transition-none ${isCollapsed ? 'px-[22px]' : 'px-ds-24'}`}>
        <Link to={logoTo} aria-label="AUTEDI 홈으로 이동" title={isCollapsed ? 'AUTEDI' : undefined} className={`inline-flex min-w-0 items-center transition-[gap] duration-300 ease-in-out motion-reduce:transition-none ${isCollapsed ? 'gap-0' : 'gap-ds-4'} ${focusClasses}`}>
          <img src={logo} alt="" width="28" height="28" className="shrink-0" />
          <span aria-hidden="true" className={`font-brand text-[22px] leading-[1.5] font-extrabold text-text-brand-strong ${labelTransitionClasses} ${isCollapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-[104px] translate-x-0 opacity-100'}`}>AUTEDI</span>
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
        <nav id={navigationId} aria-label="주 메뉴" className="mt-ds-24 min-h-0 w-[calc(100%+var(--spacing-16))] flex-1 self-center overflow-y-auto p-ds-8">
          <ul className="flex flex-col gap-ds-32">
            {items.map(({ id, label, ...item }) => (
              <li key={id} className="shrink-0">
                <SidebarItem {...item} collapsed={isCollapsed}>{label}</SidebarItem>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          to={helpTo}
          title={isCollapsed ? '도움말' : undefined}
          className={[
            'mt-ds-16 inline-flex w-full shrink-0 items-center text-label2-semibold text-text-neutral-subtle transition-[gap,padding,min-height] duration-300 ease-in-out motion-reduce:transition-none',
            isCollapsed ? 'min-h-ds-16 gap-0 pl-[4px]' : 'min-h-ds-20 gap-ds-8 pl-0',
            focusClasses,
          ].join(' ')}
        >
          <img src={helpIcon} alt="" width="16" height="16" className="shrink-0" />
          <span className={`${labelTransitionClasses} ${isCollapsed ? 'max-h-0 max-w-0 -translate-x-1 opacity-0' : 'max-h-ds-20 max-w-[100px] translate-x-0 opacity-100'}`}>도움말</span>
        </Link>
      </div>
    </aside>
  )
}
