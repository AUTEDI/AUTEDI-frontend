import type { EventSink } from './events'

type Client = ReturnType<typeof import('@amplitude/unified').createInstance>
let ready: Promise<Client> | undefined

/** 키가 없으면 SDK를 불러오거나 통신하지 않는다. React 재렌더링에도 초기화는 한 번만 한다. */
export function initializeAnalytics() {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY?.trim()
  if (!apiKey || ready) return
  ready = import('@amplitude/unified').then(async ({ createInstance }) => {
    const client = createInstance()
    // 필요한 이벤트만 직접 기록한다. 화면 녹화·실험·가이드 플러그인은 초기화하지 않는다.
    // Unified 1.2.4는 항상 인자 세 개를 Browser SDK에 넘기므로 설정은 세 번째에 둔다.
    await client.init(apiKey, undefined, {
      serverZone: import.meta.env.VITE_AMPLITUDE_SERVER_ZONE === 'EU' ? 'EU' : 'US',
      autocapture: false,
      defaultTracking: false,
      fetchRemoteConfig: false,
      trackingOptions: { ipAddress: false },
    }).promise
    return client
  })
  // 분석 서비스의 실패가 로그인이나 첨삭을 중단하지 않게 한다.
  void ready.catch(() => {})
}

export const trackEvent: EventSink = (event, properties) => {
  if (!ready) return
  void ready.then(client => client.track(event, {
    ...properties,
    environment: import.meta.env.MODE,
  }).promise).catch(() => {})
}
