import axios from 'axios'
import type { AuthSession, LoginCredentials, LoginResponse } from '../types/auth'
import { apiClient } from './client'

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false
  const session = value as Record<string, unknown>
  if (typeof session.accessToken !== 'string' || !session.accessToken
    || typeof session.refreshToken !== 'string' || !session.refreshToken
    || typeof session.user !== 'object' || session.user === null) return false

  const user = session.user as Record<string, unknown>
  return typeof user.userId === 'number'
    && typeof user.email === 'string'
    && typeof user.name === 'string'
    && typeof user.role === 'string'
    && typeof user.academyId === 'number'
    && typeof user.academyName === 'string'
    && typeof user.subscriptionStatus === 'string'
}

function serverMessage(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const message = (value as Record<string, unknown>).message
  return typeof message === 'string' && message.trim() ? message : undefined
}

export async function login(credentials: LoginCredentials): Promise<AuthSession> {
  let data: LoginResponse
  try {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', credentials)
    data = response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = serverMessage(error.response?.data)
      if (message) throw new Error(message, { cause: error })
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('요청 시간이 초과됐어요. 잠시 후 다시 시도해주세요.', { cause: error })
      }
      if (!error.response) throw new Error('서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.', { cause: error })
    }
    throw new Error('로그인하지 못했어요. 이메일과 비밀번호를 확인해주세요.', { cause: error })
  }

  if (data?.isSuccess !== true) {
    throw new Error(serverMessage(data) ?? '로그인하지 못했어요. 이메일과 비밀번호를 확인해주세요.')
  }
  if (!isAuthSession(data.result)) {
    throw new Error('로그인 정보를 확인할 수 없어요. 잠시 후 다시 시도해주세요.')
  }
  return data.result
}
