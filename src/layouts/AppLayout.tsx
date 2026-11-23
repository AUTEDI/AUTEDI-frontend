import { useLayoutEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { logout } from '../apis/auth'
import GNB from '../components/gnb/GNB'
import Sidebar from '../components/sidebar/Sidebar'
import { useAuthStore } from '../stores/useAuthStore'

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const loggingOutRef = useRef(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  async function handleLogout() {
    if (loggingOutRef.current) return
    loggingOutRef.current = true
    setIsLoggingOut(true)
    setLogoutError('')

    try {
      const { refreshToken, accessToken, clearSession } = useAuthStore.getState()
      if (refreshToken) await logout(refreshToken, accessToken)
      clearSession()
      navigate('/', { replace: true })
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : '로그아웃하지 못했어요. 다시 시도해주세요.')
    } finally {
      loggingOutRef.current = false
      setIsLoggingOut(false)
    }
  }

  return (
    // relative: 화면 읽기용 숨김 글자(sr-only, absolute)가 이 틀 밖으로 나가 문서 전체를 길게 만들지 않게 가둔다.
    <div className="relative flex h-dvh overflow-hidden">
      <Sidebar onLogout={handleLogout} isLoggingOut={isLoggingOut} logoutError={logoutError} />
      <div className="flex min-w-0 flex-1 flex-col">
        <GNB academyName={user?.academyName ?? ''} userName={user?.name ?? ''} />
        <main ref={mainRef} className="relative min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
