import type { FeedbackLevel, FeedbackSetting, SettingId } from '../types/review'

export const BASE_SETTINGS: FeedbackSetting[] = [
  {
    id: 'grammar',
    name: '문법 및 철자',
    en: 'Grammar & Mechanics',
    icon: 'Aa',
    desc: '시제, 주어·동사 일치, 관사, 철자와 구두점',
    selected: true,
    level: 'Standard',
  },
  {
    id: 'vocabulary',
    name: '어휘 및 표현',
    en: 'Vocabulary & Expression',
    icon: '“ ”',
    desc: '단어 선택, 부자연스러운 표현과 불필요한 반복',
    selected: true,
    level: 'Advanced',
  },
  {
    id: 'structure',
    name: '문장 구성',
    en: 'Sentence Structure',
    icon: '↳',
    desc: '불완전한 문장, 문장 간 연결과 반복 구조',
    selected: true,
    level: 'Standard',
  },
  {
    id: 'content',
    name: '내용 및 요약',
    en: 'Content & Summary',
    icon: '≡',
    desc: '글의 명확성, 설명의 충분성과 전체 흐름',
    selected: true,
    level: 'Standard',
  },
]

export const LEVEL_DESCRIPTIONS: Record<FeedbackLevel, string> = {
  Standard: '핵심 오류 중심으로 수정',
  Advanced: '표현과 흐름까지 깊이 개선',
}

export const SETTING_DOT_CLASS: Record<SettingId, string> = {
  grammar: 'bg-[#8a6de6]',
  vocabulary: 'bg-[#5b82e8]',
  structure: 'bg-[#49a5ce]',
  content: 'bg-[#4e577c]',
}

/** 기본 첨삭 설정을 저장하는 localStorage 키 (기획 프로토타입과 같은 키) */
export const DEFAULT_SETTINGS_STORAGE_KEY = 'autedi-defaults'

export function cloneSettings(settings: FeedbackSetting[]) {
  return settings.map((setting) => ({ ...setting }))
}
