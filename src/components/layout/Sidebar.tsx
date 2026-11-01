import type { ComponentType, SVGProps } from 'react'
import { USE_LIVE_API } from '../../apis/config'
import { useAppStore, type Page } from '../../stores/useAppStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { cn } from '../../utils/cn'
import { CalendarIcon, HomeIcon, PenIcon, SidebarToggleIcon, StudentIcon } from './icons'

type NavItem = {
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
} & ({ page: Page } | { badge: string; notice: string; locked?: boolean })

const NAV_ITEMS: NavItem[] = [
  { label: '홈', Icon: HomeIcon, page: 'home' },
  { label: 'AI 첨삭', Icon: PenIcon, page: 'ai' },
  { label: '이력 관리', Icon: CalendarIcon, badge: '준비 중', notice: '이력 관리는 곧 열릴 예정이에요' },
  {
    label: '학생 관리',
    Icon: StudentIcon,
    badge: '권한 없음',
    notice: '학생 관리 접근 권한이 아직 없어요',
    locked: true,
  },
]

export function Sidebar() {
  const page = useAppStore((state) => state.page)
  const collapsed = useAppStore((state) => state.sidebarCollapsed)
  const navigate = useAppStore((state) => state.navigate)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const showToast = useAppStore((state) => state.showToast)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  // 접힌 상태이거나 1050px 이하에서는 아이콘만 남긴다.
  const hideLabel = collapsed ? 'hidden' : 'max-md:hidden'

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex flex-col px-[18px] pt-[29px] pb-[22px] text-white transition-[width] duration-240',
        'bg-[linear-gradient(160deg,#181b2f_0%,#111423_62%,#18234e_100%)]',
        "after:pointer-events-none after:absolute after:top-[47%] after:-right-[215px] after:size-[300px] after:rounded-full after:bg-[radial-gradient(circle_at_32%_30%,rgba(104,114,247,0.3),transparent_68%)] after:content-['']",
        collapsed ? 'w-[78px]' : 'w-[248px] sm:max-md:w-[84px]',
        'max-md:items-center sm:max-md:px-[13px] sm:max-md:py-6',
        'max-sm:sticky max-sm:top-0 max-sm:h-[61px] max-sm:w-full max-sm:flex-row max-sm:bg-[linear-gradient(100deg,#171a2d,#1b2450)] max-sm:px-[17px] max-sm:py-[10px]',
      )}
    >
      <a
        className={cn(
          'flex items-center gap-[10px] font-[850] tracking-[1.8px] text-white no-underline',
          collapsed ? 'justify-center px-0' : 'px-[10px] max-md:px-0',
        )}
        href="#home"
        onClick={(event) => {
          event.preventDefault()
          navigate('home')
        }}
      >
        <span
          className={cn(
            'grid size-8 place-items-center rounded-[10px] bg-[linear-gradient(135deg,#8985ff,#4055d4)] font-serif text-[19px] font-bold shadow-[0_8px_24px_rgba(73,80,214,0.38)]',
            collapsed && 'hidden max-sm:grid',
          )}
        >
          A
        </span>
        <b className={collapsed ? 'hidden max-sm:inline' : 'sm:max-md:hidden'}>AUTEDI</b>
      </a>
      <button
        aria-expanded={!collapsed}
        aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        className={cn(
          'absolute top-[33px] grid h-[30px] w-[34px] place-items-center rounded-lg border border-[#d9dce5] bg-white text-[#737783] shadow-[0_3px_10px_rgba(0,0,0,0.08)] hover:border-[#bfc3cf] hover:text-[#363b4c] max-md:hidden',
          collapsed ? 'right-[22px]' : 'right-[17px]',
        )}
        onClick={toggleSidebar}
        type="button"
      >
        <SidebarToggleIcon className="size-[22px] fill-none stroke-current stroke-[1.8]" />
      </button>
      <nav aria-label="주요 메뉴" className="mt-[66px] grid gap-2 sm:max-md:mt-[55px] max-sm:mt-0 max-sm:ml-auto max-sm:flex">
        {NAV_ITEMS.map((item) => {
          const active = 'page' in item && item.page === page
          return (
            <button
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={cn(
                'relative flex items-center gap-3 rounded-xl text-left',
                collapsed ? 'justify-center p-3' : 'px-[13px] py-3 max-md:justify-center sm:max-md:p-3',
                'max-sm:p-[9px]',
                active
                  ? 'bg-[linear-gradient(90deg,rgba(108,109,244,0.24),rgba(84,101,226,0.1))] text-white'
                  : 'locked' in item && item.locked
                    ? 'text-[#6f768f]'
                    : 'text-[#9299b3]',
              )}
              key={item.label}
              onClick={() => ('page' in item ? navigate(item.page) : showToast(item.notice))}
              title={item.label}
              type="button"
            >
              <item.Icon
                className={cn('size-5 shrink-0 fill-none stroke-[1.8]', active ? 'stroke-[#9097ff]' : 'stroke-current')}
              />
              <span className={cn('text-[13px] font-bold', hideLabel)}>{item.label}</span>
              {'badge' in item && (
                <i
                  className={cn(
                    'ml-auto rounded-[5px] bg-white/7 px-[5px] py-[3px] text-[7px] whitespace-nowrap text-[#858da9] not-italic',
                    hideLabel,
                  )}
                >
                  {item.badge}
                </i>
              )}
            </button>
          )
        })}
      </nav>
      <div className={cn('mt-auto max-sm:hidden', collapsed && 'grid justify-items-center')}>
        <button
          className={cn('flex items-center gap-3 text-[12px] text-[#959cb6]', collapsed ? 'p-3' : 'px-[14px] py-3')}
          onClick={() => showToast('도움말은 준비 중이에요')}
          type="button"
        >
          ? <span className={hideLabel}>도움말</span>
        </button>
        <div
          className={cn(
            'mt-3 flex items-center gap-[10px] border-t border-white/10',
            collapsed ? 'px-0 pt-[15px]' : 'px-[7px] pt-[18px] sm:max-md:px-0 sm:max-md:pt-4',
          )}
        >
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#f0efff,#b3b7f1)] text-[10px] font-extrabold text-[#3e4ab4]">
            {user?.initials ?? user?.name.slice(0, 1)}
          </span>
          <div className={cn('grid min-w-0 gap-0.5', hideLabel)}>
            <b className="truncate text-[10px] text-white">{user?.name}</b>
            <small className="truncate text-[7px] text-[#747d9a]">{user?.academyName}</small>
          </div>
          <button
            aria-label={USE_LIVE_API ? '로그아웃' : '사용자 메뉴'}
            className={cn('ml-auto shrink-0 text-[#858da6]', hideLabel)}
            onClick={() => (USE_LIVE_API ? void logout() : showToast('사용자 메뉴는 준비 중이에요'))}
            title={USE_LIVE_API ? '로그아웃' : undefined}
            type="button"
          >
            •••
          </button>
        </div>
      </div>
    </aside>
  )
}
