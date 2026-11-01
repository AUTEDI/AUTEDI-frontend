import { api } from './client'
import type { AuthUserDto, LoginResponse } from './types'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }, { anonymous: true }),
  logout: (refreshToken: string) => api.post<null>('/auth/logout', { refreshToken }),
  me: () => api.get<AuthUserDto>('/users/me'),
}
