import { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ReviewPage } from './pages/ReviewPage'
import { useAppStore } from './stores/useAppStore'
import { useAuthStore } from './stores/useAuthStore'

function App() {
  const page = useAppStore((state) => state.page)
  const authStatus = useAuthStore((state) => state.status)
  const restore = useAuthStore((state) => state.restore)

  useEffect(() => {
    void restore()
  }, [restore])

  if (authStatus === 'checking') {
    return <div className="grid min-h-screen place-items-center text-[10px] text-[#8a8fa0]">로그인 정보를 확인하고 있어요…</div>
  }
  if (authStatus === 'guest') return <LoginPage />

  return <AppShell>{page === 'home' ? <HomePage /> : <ReviewPage />}</AppShell>
}

export default App
