import type { ReactElement, ReactNode } from 'react'
import { NavLink, type NavLinkProps, type NavLinkRenderProps } from 'react-router'
import homeActive from '../../assets/design-system/sidebar-home-active.svg'
import homeInactive from '../../assets/design-system/sidebar-home-inactive.svg'
import homeHover from '../../assets/design-system/sidebar-home-hover.svg'
import correctionActive from '../../assets/design-system/sidebar-correction-active.svg'
import correctionInactive from '../../assets/design-system/sidebar-correction-inactive.svg'
import correctionHover from '../../assets/design-system/sidebar-correction-hover.svg'
import studentsActive from '../../assets/design-system/sidebar-students-active.svg'
import studentsInactive from '../../assets/design-system/sidebar-students-inactive.svg'
import studentsHover from '../../assets/design-system/sidebar-students-hover.svg'
import teachersActive from '../../assets/design-system/sidebar-teachers-active.svg'
import teachersInactive from '../../assets/design-system/sidebar-teachers-inactive.svg'
import teachersHover from '../../assets/design-system/sidebar-teachers-hover.svg'

const menuIcons = {
  home: { active: homeActive, inactive: homeInactive, hover: homeHover },
  correction: { active: correctionActive, inactive: correctionInactive, hover: correctionHover },
  students: { active: studentsActive, inactive: studentsInactive, hover: studentsHover },
  teachers: { active: teachersActive, inactive: teachersInactive, hover: teachersHover },
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
        'group relative flex min-h-ds-24 w-full min-w-0 shrink-0 items-center font-sans text-label1-semibold',
        'rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focused',
        state.isActive ? 'text-text-brand-strong' : 'text-text-neutral-subtle hover:text-text-neutral-muted',
        typeof className === 'function' ? className(state) : className,
      ].join(' ')}
    >
      {state => (
        <>
          <span
            aria-hidden="true"
            className={[
              'inline-flex size-ds-24 shrink-0 items-center justify-center',
              state.isActive ? 'text-icon-brand-strong' : 'text-icon-neutral-subtle group-hover:text-icon-neutral-muted',
            ].join(' ')}
          >
            {typeof icon === 'string' ? (
              <>
                <img
                  src={menuIcons[icon][state.isActive ? 'active' : 'inactive']}
                  alt=""
                  width="24"
                  height="24"
                  className={`max-w-none ${state.isActive ? '' : 'group-hover:hidden'}`}
                />
                {!state.isActive && (
                  <img
                    src={menuIcons[icon].hover}
                    alt=""
                    width="24"
                    height="24"
                    className="hidden max-w-none group-hover:block"
                  />
                )}
              </>
            ) : typeof icon === 'function' ? icon(state) : icon}
          </span>
          <span className={`pointer-events-none absolute inset-y-0 left-ds-32 flex items-center whitespace-nowrap transition-opacity duration-200 ease-out motion-reduce:transition-none ${collapsed ? 'opacity-0' : 'opacity-100'}`}>{children}</span>
        </>
      )}
    </NavLink>
  )
}
