import { Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import CorrectionUploadPage from './pages/corrections/CorrectionUploadPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* 페이지 구현 후 null을 해당 페이지 컴포넌트로 교체합니다. */}
        <Route index element={null} />
        <Route path="corrections/*" element={<CorrectionUploadPage />} />
        <Route path="students/*" element={null} />
        <Route path="teachers/*" element={null} />
        <Route path="help/*" element={null} />
        <Route path="*" element={null} />
      </Route>
    </Routes>
  )
}

export default App
