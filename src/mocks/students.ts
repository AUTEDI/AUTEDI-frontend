import type { CorrectionPerson } from '../types/correction'

// shortcut: 학생 관리 API가 없어 사용성 테스트용 학생 목록을 둔다, 학생 목록 API가 생기면 이 데이터 공급부를 교체한다.
export const mockStudents: readonly CorrectionPerson[] = [
  { id: 'student-jung-seungwoo', name: '정승우' },
  { id: 'student-lee-jeongmin', name: '이정민' },
]
