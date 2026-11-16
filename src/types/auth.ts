export type LoginCredentials = {
  email: string
  password: string
}

export type AuthUser = {
  userId: number
  email: string
  name: string
  role: string
  academyId: number
  academyName: string
  subscriptionStatus: string
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type LoginResponse = {
  isSuccess: boolean
  code: string
  message: string
  result: AuthSession | null
  error: unknown
}
