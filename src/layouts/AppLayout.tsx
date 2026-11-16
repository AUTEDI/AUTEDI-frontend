import { useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import GNB from '../components/gnb/GNB'
import Sidebar from '../components/sidebar/Sidebar'
import { useAuthStore } from '../stores/useAuthStore'

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const user = useAuthStore(state => state.user)

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GNB academyName={user?.academyName ?? ''} userName={user?.name ?? ''} />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
