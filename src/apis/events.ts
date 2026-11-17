import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useAuthStore } from '../stores/useAuthStore'
import { refreshAccessToken } from './client'

/** SSE 이벤트. data에는 ID만 담겨 오므로 상세 내용은 REST로 다시 조회한다. */
export type ServerEvent = { event: string; data: Record<string, unknown> }

const EVENTS_URL = `${import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL ?? '')}/api/v1/events`
const MAX_RETRY_MS = 30_000

class Unauthorized extends Error {}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve() }, { once: true })
  })

/**
 * 서버 이벤트를 구독한다. 서버가 연결을 닫으면(30분, 토큰 만료) 1초→2초→4초…최대 30초 간격으로
 * 최신 accessToken을 실어 다시 연결한다. 돌려받은 함수를 부르면 연결을 끊는다.
 */
export function subscribeEvents(onEvent: (event: ServerEvent) => void): () => void {
  const controller = new AbortController()
  const { signal } = controller

  void (async () => {
    let retryMs = 1000
    while (!signal.aborted) {
      const { accessToken } = useAuthStore.getState()
      if (!accessToken) return
      try {
        await fetchEventSource(EVENTS_URL, {
          signal,
          headers: { Authorization: `Bearer ${accessToken}` },
          openWhenHidden: true,
          async onopen(response) {
            if (response.status === 401) throw new Unauthorized()
            if (!response.ok) throw new Error(`SSE 연결 실패 (${response.status})`)
            retryMs = 1000
          },
          onmessage(message) {
            if (!message.event) return
            try {
              const data: unknown = JSON.parse(message.data)
              if (typeof data === 'object' && data !== null) onEvent({ event: message.event, data: data as Record<string, unknown> })
            } catch {
              // 형식이 깨진 이벤트는 건너뛴다.
            }
          },
          onerror(error) {
            // 라이브러리 자체 재시도는 처음 토큰을 계속 쓰므로 끄고, 아래 반복문에서 최신 토큰으로 다시 연결한다.
            throw error
          },
        })
      } catch (error) {
        if (error instanceof Unauthorized) {
          // 다른 요청이 이미 재발급했으면 새 토큰으로 다시 연결만 한다. 서버가 401을 계속 주더라도
          // 재발급만 반복하지 않도록 아래 대기 간격은 그대로 지킨다.
          // 재발급이 거절되면 로그아웃돼 반복문 처음에서 끝나고, 네트워크 오류면 잠시 뒤 다시 시도한다.
          if (useAuthStore.getState().accessToken === accessToken) await refreshAccessToken().catch(() => {})
        }
      }
      await wait(retryMs, signal)
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
    }
  })()

  return () => controller.abort()
}
