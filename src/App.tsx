import { Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import HomePage from './pages/home/HomePage'
import CorrectionHistoryPage from './pages/history/CorrectionHistoryPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="correction-history" element={<CorrectionHistoryPage />} />
        {/* 페이지 구현 후 null을 해당 페이지 컴포넌트로 교체합니다. */}
        <Route path="corrections" element={null} />
        <Route path="students/*" element={null} />
        <Route path="teachers/*" element={null} />
        <Route path="help/*" element={null} />
        <Route path="*" element={null} />
      </Route>
    </Routes>
  )
}

export default App
