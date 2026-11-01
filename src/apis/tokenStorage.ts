import type { TokenPair } from './types'

const STORAGE_KEY = 'autedi-auth-tokens'

/**
 * 로그인 토큰 보관. 새로고침 후에도 로그인을 유지하려고 localStorage를 쓴다.
 * 보안 정책(HttpOnly 쿠키 등)이 정해지면 이 파일만 바꾸면 된다.
 */
export const tokenStorage = {
  get(): TokenPair | null {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as TokenPair).accessToken === 'string' &&
        typeof (value as TokenPair).refreshToken === 'string'
      ) {
        return value as TokenPair
      }
    } catch {
      // 읽을 수 없으면 로그아웃 상태로 본다.
    }
    return null
  },
  set(tokens: TokenPair) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }))
    } catch {
      // 저장 공간을 쓸 수 없으면 이번 접속 동안만 로그인이 유지되지 않는다.
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 지울 수 없어도 서버 토큰은 로그아웃 API로 무효화된다.
    }
  },
}
