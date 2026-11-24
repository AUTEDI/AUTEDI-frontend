import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { trackEvent } from './client'
import { screenForPath } from './events'

export default function AnalyticsRouteTracker() {
  const { pathname } = useLocation()
  const previousPath = useRef<string | null>(null)
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    trackEvent('Screen Viewed', { screen: screenForPath(pathname) })
  }, [pathname])
  return null
}
