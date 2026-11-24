import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { initializeAnalytics } from './analytics/client'
import AnalyticsRouteTracker from './analytics/AnalyticsRouteTracker'

initializeAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AnalyticsRouteTracker />
      <App />
    </BrowserRouter>
  </StrictMode>,
)
