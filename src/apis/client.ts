import axios, { type AxiosRequestConfig } from 'axios'
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
      retryAfter: Number(failed.headers['retry-after']) || undefined,
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
