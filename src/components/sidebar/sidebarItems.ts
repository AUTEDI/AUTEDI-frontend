import type { SidebarItemProps } from './SidebarItem'

export type SidebarMenuItem = Omit<SidebarItemProps, 'children' | 'collapsed'> & {
  id: string
  label: string
}

// 실제 화면 경로가 정해지면 이 목록의 to를 변경합니다.
export const sidebarItems = [
  { id: 'home', label: '홈', to: '/', icon: 'home', end: true },
  { id: 'corrections', label: 'AI 첨삭', to: '/corrections', icon: 'correction' },
  { id: 'students', label: '학생 관리', to: '/students', icon: 'students' },
  { id: 'teachers', label: '선생님 관리', to: '/teachers', icon: 'teachers' },
] as const satisfies readonly SidebarMenuItem[]
