// 로그인 API의 응답이 확정되면 이 화면용 모델로 매핑합니다.
export type UserRole = 'director' | 'teacher'

export type User = {
  id: string
  name: string
  role: UserRole
}
