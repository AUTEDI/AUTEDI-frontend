import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import CorrectionUploadPage from './pages/corrections/CorrectionUploadPage'
import HomePage from './pages/home/HomePage'
import CorrectionHistoryPage from './pages/history/CorrectionHistoryPage'
import LoginPage from './pages/login/LoginPage'
import { useAuthStore } from './stores/useAuthStore'

function App() {
  const isAuthenticated = useAuthStore(state => Boolean(state.accessToken && state.user))

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/main" replace /> : <LoginPage />} />
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/" replace />}>
        <Route path="main" element={<HomePage />} />
        <Route path="corrections/*" element={<CorrectionUploadPage />} />
        <Route path="correction-history" element={<CorrectionHistoryPage />} />
        {/* 페이지 구현 후 null을 해당 페이지 컴포넌트로 교체합니다. */}
        <Route path="students/*" element={null} />
        <Route path="teachers/*" element={null} />
        <Route path="help/*" element={null} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/main' : '/'} replace />} />
    </Routes>
  )
}

export default App
