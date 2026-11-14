import type { ReactElement, ReactNode } from 'react'
import { NavLink, type NavLinkProps, type NavLinkRenderProps } from 'react-router'
import homeActive from '../../assets/design-system/sidebar-home-active.svg'
import homeInactive from '../../assets/design-system/sidebar-home-inactive.svg'
import correctionActive from '../../assets/design-system/sidebar-correction-active.svg'
import correctionInactive from '../../assets/design-system/sidebar-correction-inactive.svg'
import studentsActive from '../../assets/design-system/sidebar-students-active.svg'
import studentsInactive from '../../assets/design-system/sidebar-students-inactive.svg'
import teachersActive from '../../assets/design-system/sidebar-teachers-active.svg'
import teachersInactive from '../../assets/design-system/sidebar-teachers-inactive.svg'

const menuIcons = {
  home: { active: homeActive, inactive: homeInactive },
  correction: { active: correctionActive, inactive: correctionInactive },
  students: { active: studentsActive, inactive: studentsInactive },
  teachers: { active: teachersActive, inactive: teachersInactive },
} as const

export type SidebarItemIcon = keyof typeof menuIcons

export type SidebarItemProps = Omit<NavLinkProps, 'children'> & {
  children: string
  icon: SidebarItemIcon | ReactElement | ((state: NavLinkRenderProps) => ReactNode)
  collapsed?: boolean
}

export default function SidebarItem({
  children,
  icon,
  collapsed = false,
  className = '',
  title,
  ...props
}: SidebarItemProps) {
  return (
    <NavLink
      {...props}
      title={title ?? (collapsed ? children : undefined)}
      className={state => [
        'group flex min-h-ds-24 min-w-0 shrink-0 items-center font-sans text-label1-semibold transition-[width,gap] duration-300 ease-in-out motion-reduce:transition-none',
        'rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused',
        collapsed ? 'w-ds-24 gap-0' : 'w-full gap-ds-8',
        state.isActive ? 'text-text-brand-strong' : 'text-text-brand-subtle hover:text-text-brand-strong',
        typeof className === 'function' ? className(state) : className,
      ].join(' ')}
    >
      {state => (
        <>
          <span
            aria-hidden="true"
            className={[
              'inline-flex size-ds-24 shrink-0 items-center justify-center',
              state.isActive ? 'text-icon-brand-strong' : 'text-icon-brand-subtle group-hover:text-icon-brand-strong',
            ].join(' ')}
          >
            {typeof icon === 'string' ? (
              <img
                src={menuIcons[icon][state.isActive ? 'active' : 'inactive']}
                alt=""
                width="24"
                height="24"
                className="max-w-none"
              />
            ) : typeof icon === 'function' ? icon(state) : icon}
          </span>
          <span className={`min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-in-out motion-reduce:transition-none ${collapsed ? 'max-w-0 -translate-x-1 opacity-0' : 'max-w-[160px] translate-x-0 opacity-100'}`}>{children}</span>
        </>
      )}
    </NavLink>
  )
}
