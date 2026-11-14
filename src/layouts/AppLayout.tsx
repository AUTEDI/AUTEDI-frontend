import { Outlet } from 'react-router'
import GNB from '../components/gnb/GNB'
import Sidebar from '../components/sidebar/Sidebar'

export default function AppLayout() {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GNB />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
