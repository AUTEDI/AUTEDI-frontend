import type { FlowStep } from '../types/review'

export const FLOW_META: Record<FlowStep, { title: string; subtitle: string; step: number }> = {
  upload: {
    title: '학생의 학습지를 올려주세요',
    subtitle: '글이 적힌 실제 사진이나 스캔 파일을 업로드하세요. 원본 이미지는 수정되지 않아요.',
    step: 1,
  },
  settings: {
    title: '이번 첨삭 설정을 확인해주세요',
    subtitle: '저장된 기본 설정 대신 이번 사진에서만 사용할 영역과 수준을 선택하세요.',
    step: 1,
  },
  generation: {
    title: 'AI 첨삭을 생성하고 있어요',
    subtitle: '사진 속 글의 위치를 분석해 원본 위에 별도 첨삭 레이어를 만들어요.',
    step: 2,
  },
  review: {
    title: '사진 위 첨삭 결과를 확인해주세요',
    subtitle: '원본 사진 위 표시를 선택하면 오른쪽에서 수정하거나 삭제할 수 있어요.',
    step: 3,
  },
}

export const FLOW_STEP_COUNT = 3
