import { useEffect, type PropsWithChildren } from 'react'
import brandIcon from '../image/pavicon.ico'
import { useAppStore } from '../store/useAppStore'

type AppShellProps = PropsWithChildren<{
  onNavigate: (page: 'home' | 'review') => void
}>

export function AppShell({ children, onNavigate }: AppShellProps) {
  const page = useAppStore((state) => state.page)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const showToast = useAppStore((state) => state.showToast)

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <a
          aria-label="AUTEDI 홈"
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault()
            onNavigate('home')
          }}
        >
          <img className="brand-mark" src={brandIcon} alt="" />
          <b>AUTEDI</b>
        </a>
        <button
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className="sidebar-toggle"
          onClick={toggleSidebar}
          type="button"
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        <nav aria-label="주요 메뉴" className="main-nav">
          <button
            aria-label="홈"
            title="홈"
            aria-current={page === 'home' ? 'page' : undefined}
            className={`nav-item${page === 'home' ? ' active' : ''}`}
            onClick={() => onNavigate('home')}
            type="button"
          >
            <span className="nav-icon">⌂</span>
            <span>홈</span>
          </button>
          <button
            aria-label="AI 첨삭"
            title="AI 첨삭"
            aria-current={page === 'review' ? 'page' : undefined}
            className={`nav-item${page === 'review' ? ' active' : ''}`}
            onClick={() => onNavigate('review')}
            type="button"
          >
            <span className="nav-icon">✎</span>
            <span>AI 첨삭</span>
          </button>
          <button aria-label="이력 관리 (준비 중)" title="이력 관리 (준비 중)" className="nav-item nav-disabled" onClick={() => showToast('이력 관리는 곧 열릴 예정이에요')} type="button">
            <span className="nav-icon">◷</span>
            <span>이력 관리</span>
            <i>준비 중</i>
          </button>
          <button
            aria-label="학생 관리 (권한 없음)"
            title="학생 관리 (권한 없음)"
            className="nav-item nav-disabled"
            onClick={() => showToast('학생 관리 접근 권한이 아직 없어요')}
            type="button"
          >
            <span className="nav-icon">♙</span>
            <span>학생 관리</span>
            <i>권한 없음</i>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button className="help-link" onClick={() => showToast('도움말은 준비 중이에요')} type="button">
            <span>?</span>
            도움말
          </button>
          <div className="user-profile">
            <span className="user-avatar">FL</span>
            <div>
              <b>Frances 선생님</b>
              <small>교사 작업 공간</small>
            </div>
            <button aria-label="사용자 메뉴" onClick={() => showToast('사용자 메뉴는 준비 중이에요')} type="button">
              ···
            </button>
          </div>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>{page === 'home' ? '홈' : 'AI 첨삭'}</span>
            <i />
            <b>{page === 'home' ? '대시보드' : '새 첨삭'}</b>
          </div>
          <span className="topbar-avatar">FL</span>
        </header>
        {children}
      </main>
      <Toast />
    </div>
  )
}

function Toast() {
  const toast = useAppStore((state) => state.toast)
  const clearToast = useAppStore((state) => state.clearToast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 3000)
    return () => window.clearTimeout(timer)
  }, [clearToast, toast])

  if (!toast) return null

  return (
    <div aria-live="polite" className="toast">
      <span>{toast}</span>
      <button aria-label="알림 닫기" onClick={clearToast} type="button">
        ×
      </button>
    </div>
  )
}
