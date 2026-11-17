import contentCorrection from '../../../assets/design-system/area-content-correction.svg'
import contentSuggestion from '../../../assets/design-system/area-content-suggestion.svg'
import grammarCorrection from '../../../assets/design-system/area-grammar-correction.svg'
import grammarSuggestion from '../../../assets/design-system/area-grammar-suggestion.svg'
import structureCorrection from '../../../assets/design-system/area-structure-correction.svg'
import structureSuggestion from '../../../assets/design-system/area-structure-suggestion.svg'
import vocabularyCorrection from '../../../assets/design-system/area-vocabulary-correction.svg'
import vocabularySuggestion from '../../../assets/design-system/area-vocabulary-suggestion.svg'

/** 영역 이름과 아이콘(오류 수정용·개선 제안용). 아이콘은 SVG 원래 크기로 가운데에 놓는다. */
const AREAS = {
  grammar: { label: '문법 및 철자', icons: [grammarCorrection, grammarSuggestion], size: [18.6, 18.03] },
  vocabulary: { label: '어휘 및 표현', icons: [vocabularyCorrection, vocabularySuggestion], size: [24, 24] },
  structure: { label: '문장 구성', icons: [structureCorrection, structureSuggestion], size: [14.86, 19.6] },
  content: { label: '내용 및 요약', icons: [contentCorrection, contentSuggestion], size: [16.6, 19.6] },
} as const

const AREA_BY_CODE: Record<string, keyof typeof AREAS> = {
  GRAMMAR_SPELLING: 'grammar',
  GRAMMAR_MECHANICS: 'grammar',
  VOCABULARY_EXPRESSION: 'vocabulary',
  SENTENCE_STRUCTURE: 'structure',
  CONTENT_SUMMARY: 'content',
}

/** 서버의 영역 코드에 맞는 이름·아이콘. 모르는 코드는 문법으로 본다. */
export const areaOf = (code: string) => AREAS[AREA_BY_CODE[code] ?? 'grammar']
