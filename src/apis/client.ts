import { API_BASE_URL } from './config'
import { ApiError, toApiError } from './errors'
import { tokenStorage } from './tokenStorage'
import type { TokenPair } from './types'

/** 모든 API 경로 앞에 붙는 접두사 (API 명세 공통 기준) */
export const API_PREFIX = '/api/v1'

const API_URL = `${API_BASE_URL}${API_PREFIX}`

/** 토큰을 재발급할 수 없어 다시 로그인해야 할 때 부른다. */
let onAuthLost: (() => void) | null = null

export function setAuthLostHandler(handler: () => void) {
  onAuthLost = handler
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  /** 일반 객체는 JSON으로, FormData는 그대로(multipart) 보낸다. */
  body?: unknown
  /** 수정 요청에 붙일 ETag. 없거나 다르면 서버가 412(COMMON_412)를 돌려준다. */
  ifMatch?: string | null
  headers?: Record<string, string>
  /** 인증 헤더 없이 보낸다 (로그인·토큰 재발급). */
  anonymous?: boolean
  signal?: AbortSignal
}

export type ApiResponse<T> = {
  data: T
  /** 다음 수정 요청의 If-Match에 넣을 값 */
  etag: string | null
  status: number
}

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null
  const contentType = response.headers.get('Content-Type') ?? ''
  if (contentType.includes('json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  const text = await response.text()
  return text || null
}

/** 학습지 API의 { isSuccess, result } 포장을 벗긴다. 인증 API처럼 포장이 없으면 그대로 쓴다. */
function unwrap(body: unknown) {
  if (typeof body === 'object' && body !== null && 'isSuccess' in body && 'result' in body) {
    return (body as { result: unknown }).result
  }
  return body
}

async function send(path: string, { method = 'GET', body, ifMatch, headers: extra, anonymous, signal }: RequestOptions) {
  const headers = new Headers({ Accept: 'application/json', ...extra })
  const accessToken = anonymous ? null : tokenStorage.get()?.accessToken
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (ifMatch) headers.set('If-Match', ifMatch)

  let payload: BodyInit | undefined
  if (body instanceof FormData) {
    payload = body
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    payload = JSON.stringify(body)
  }

  try {
    return await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR' })
  }
}

let refreshing: Promise<boolean> | null = null

/** Refresh Token으로 새 토큰을 받는다. 여러 요청이 동시에 401을 받아도 한 번만 재발급한다. */
function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStorage.get()?.refreshToken
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= (async () => {
    try {
      const response = await send('/auth/refresh', { method: 'POST', body: { refreshToken }, anonymous: true })
      if (!response.ok) return false
      const tokens = unwrap(await readBody(response)) as TokenPair
      tokenStorage.set(tokens)
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  let response = await send(path, options)

  // Access Token이 만료되면 재발급 후 한 번만 다시 보낸다.
  if (response.status === 401 && !options.anonymous) {
    if (await refreshTokens()) {
      response = await send(path, options)
    } else {
      tokenStorage.clear()
      onAuthLost?.()
    }
  }

  const body = await readBody(response)
  if (!response.ok) throw toApiError(response.status, body)
  return { data: unwrap(body) as T, etag: response.headers.get('ETag'), status: response.status }
}

type Options = Omit<RequestOptions, 'method' | 'body'>

export const api = {
  get: <T>(path: string, options?: Options) => apiRequest<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: Options) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Options) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Options) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Options) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
}
