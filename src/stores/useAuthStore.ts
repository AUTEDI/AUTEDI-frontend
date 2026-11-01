import { create } from 'zustand'
import { authApi } from '../apis/authApi'
import { setAuthLostHandler } from '../apis/client'
import { USE_LIVE_API } from '../apis/config'
import { getErrorMessage } from '../apis/errors'
import { tokenStorage } from '../apis/tokenStorage'
import type { AuthUserDto } from '../apis/types'

export type AuthUser = Pick<AuthUserDto, 'name' | 'email' | 'role' | 'academyName' | 'subscriptionStatus'> & {
  /** 프로필 동그라미에 보여줄 글자. 없으면 이름 첫 글자를 쓴다. */
  initials?: string
}

type AuthStatus = 'checking' | 'guest' | 'authenticated'

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  /** 새로고침 후 저장된 토큰으로 로그인 상태를 복원한다. */
  restore: () => Promise<void>
  /** 성공하면 null, 실패하면 화면에 보여줄 메시지를 돌려준다. */
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

/** 예시 모드에서 쓰는 교사 정보 (기획 프로토타입과 같음) */
const DEMO_USER: AuthUser = {
  name: 'Frances 선생님',
  email: 'demo@autedi.com',
  role: 'TEACHER',
  academyName: '교사 작업 공간',
  subscriptionStatus: 'ACTIVE',
  initials: 'FL',
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: USE_LIVE_API ? 'checking' : 'authenticated',
  user: USE_LIVE_API ? null : DEMO_USER,

  restore: async () => {
    if (!USE_LIVE_API) return
    if (!tokenStorage.get()) {
      set({ status: 'guest', user: null })
      return
    }
    try {
      const { data } = await authApi.me()
      set({ status: 'authenticated', user: data })
    } catch {
      tokenStorage.clear()
      set({ status: 'guest', user: null })
    }
  },
  login: async (email, password) => {
    try {
      const { data } = await authApi.login(email, password)
      tokenStorage.set(data)
      set({ status: 'authenticated', user: data.user })
      return null
    } catch (error) {
      return getErrorMessage(error, '로그인하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  },
  logout: async () => {
    const refreshToken = tokenStorage.get()?.refreshToken
    if (USE_LIVE_API && refreshToken) {
      // 서버 토큰 무효화에 실패해도 이 기기에서는 로그아웃한다.
      await authApi.logout(refreshToken).catch(() => undefined)
    }
    tokenStorage.clear()
    set(USE_LIVE_API ? { status: 'guest', user: null } : { status: 'authenticated', user: DEMO_USER })
  },
}))

// 토큰 재발급까지 실패하면 로그인 화면으로 돌아간다.
setAuthLostHandler(() => useAuthStore.setState({ status: 'guest', user: null }))
