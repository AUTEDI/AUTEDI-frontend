export type EventProperties = Record<string, string | number | boolean | null>

export type AnalyticsEvent =
  | 'Screen Viewed'
  | 'Correction Step Viewed'
  | 'Correction Files Added'
  | 'Correction Files Rejected'
  | 'Correction Settings Changed'
  | 'Correction Settings Applied'
  | 'Correction Generation Requested'
  | 'Correction Preparation Failed'
  | 'Correction Generation Status Changed'
  | 'Correction Generation Cancelled'
  | 'Correction Review Load Failed'
  | 'Correction Review Left'
  | 'Correction PDF Download Requested'
  | 'Manual Correction Interaction'

export type EventSink = (event: AnalyticsEvent, properties: EventProperties) => void

export function screenForPath(pathname: string) {
  if (pathname === '/' || pathname === '/login') return 'login'
  if (pathname === '/main') return 'home'
  if (pathname.startsWith('/corrections/review/')) return 'correction_review'
  if (pathname.startsWith('/corrections')) return 'correction_upload'
  if (pathname === '/correction-history') return 'correction_history'
  if (pathname.startsWith('/students')) return 'students'
  if (pathname.startsWith('/teachers')) return 'teachers'
  if (pathname.startsWith('/help')) return 'help'
  if (pathname.startsWith('/qr-login')) return 'qr_login'
  return 'other'
}
