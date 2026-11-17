import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/' : import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

export function authHeader() {
  return { Authorization: `Bearer ${useAuthStore.getState().accessToken ?? ''}` }
}

export function serverMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const message = (value as Record<string, unknown>).message
  return typeof message === 'string' && message.trim() ? message : undefined
}

function serverCode(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const code = (value as Record<string, unknown>).code
  return typeof code === 'string' ? code : undefined
}

/** Retry-After는 초 또는 HTTP 날짜로 온다. 둘 다 남은 초로 바꾼다. */
function retryAfterSeconds(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds)
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : Math.max(0, (date - Date.now()) / 1000)
}

/** 화면에서 에러 코드(QR_005 등)와 HTTP 상태로 분기할 수 있게 담아 둔 API 에러 */
export class ApiError extends Error {
  readonly status?: number
  readonly code?: string
  /** 429일 때 서버가 알려준 재시도 대기 시간(초) */
  readonly retryAfter?: number

  constructor(message: string, options: { status?: number; code?: string; retryAfter?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause })
    this.status = options.status
    this.code = options.code
    this.retryAfter = options.retryAfter
  }
}

/** 공통 응답 봉투를 풀어 result를 돌려준다. 실패하면 ApiError를 던진다. result 모양 검사는 호출하는 쪽에서 한다. */
export async function request(config: AxiosRequestConfig, fallbackMessage: string): Promise<unknown> {
  let response
  try {
    response = await apiClient.request(config)
  } catch (error) {
    if (!axios.isAxiosError(error)) throw error
    const failed = error.response
    if (!failed) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      throw new ApiError(
        timedOut ? '요청 시간이 초과됐어요. 잠시 후 다시 시도해주세요.' : '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.',
        { cause: error },
      )
    }
    throw new ApiError(serverMessage(failed.data) ?? fallbackMessage, {
      status: failed.status,
      code: serverCode(failed.data),
      retryAfter: retryAfterSeconds(failed.headers['retry-after']),
      cause: error,
    })
  }

  if (response.status === 204) return null
  const data: unknown = response.data
  if ((data as { isSuccess?: unknown } | null)?.isSuccess !== true) {
    throw new ApiError(serverMessage(data) ?? fallbackMessage, { status: response.status, code: serverCode(data) })
  }
  return (data as { result?: unknown }).result ?? null
}

let refreshing: Promise<string> | null = null

/**
 * refreshToken으로 새 토큰 쌍을 받아 저장하고 새 accessToken을 돌려준다.
 * Refresh Token Rotation이라 여러 곳에서 동시에 불러도 요청은 한 번만 보낸다(두 번 보내면 앞의 토큰이 무효가 된다).
 * 서버가 토큰을 거절(4xx)하면 로그아웃시킨다. 네트워크 오류·5xx·429일 때는 로그인을 그대로 둔다.
 */
export function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    const { refreshToken, clearSession } = useAuthStore.getState()
    const expired = '로그인이 만료됐어요. 다시 로그인해 주세요.'
    // 재발급하는 동안 로그아웃되거나 QR 로그인으로 세션이 바뀌었으면 그 세션은 덮어쓰거나 지우지 않는다.
    const sameSession = () => useAuthStore.getState().refreshToken === refreshToken
    try {
      if (!refreshToken) throw new ApiError(expired, { status: 401 })
      const result = await request({ method: 'post', url: '/api/v1/auth/refresh', data: { refreshToken } }, expired)
      const { accessToken, refreshToken: nextRefreshToken } = (result ?? {}) as Record<string, unknown>
      if (typeof accessToken !== 'string' || !accessToken || typeof nextRefreshToken !== 'string' || !nextRefreshToken) {
        throw new ApiError(expired, { status: 401 })
      }
      if (!sameSession()) {
        const current = useAuthStore.getState().accessToken
        if (!current) throw new ApiError(expired)
        return current
      }
      useAuthStore.setState({ accessToken, refreshToken: nextRefreshToken })
      return accessToken
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined
      const rejected = status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429
      if (rejected && sameSession()) clearSession()
      throw error
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

// 로그인 토큰을 실어 보낸 요청이 401이면 토큰을 재발급받아 한 번만 다시 보낸다.
// 로그인·QR 스캔처럼 토큰 없이 보내는 요청의 401은 그대로 돌려준다.
apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error
  const config = error.config as (InternalAxiosRequestConfig & { retriedAfterRefresh?: boolean }) | undefined
  if (!config || config.retriedAfterRefresh || !config.headers.Authorization) throw error
  config.retriedAfterRefresh = true
  let accessToken: string
  try {
    accessToken = await refreshAccessToken()
  } catch {
    throw error
  }
  config.headers.Authorization = `Bearer ${accessToken}`
  return apiClient.request(config)
})
