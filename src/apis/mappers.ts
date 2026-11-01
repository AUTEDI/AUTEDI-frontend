import { BASE_SETTINGS } from '../constants/settings'
import type {
  AiFeedback,
  AnnotationStyle,
  Box,
  FeedbackKind,
  FeedbackSetting,
  SettingId,
  TeacherComment,
} from '../types/review'
import type { AreaCode, AreaSetting, CommentDto, CorrectionDto, HighlightType, RegionDto } from './types'

const AREA_BY_SETTING: Record<SettingId, AreaCode> = {
  grammar: 'GRAMMAR_SPELLING',
  vocabulary: 'VOCABULARY_EXPRESSION',
  structure: 'SENTENCE_STRUCTURE',
  content: 'CONTENT_SUMMARY',
}

const SETTING_BY_AREA = Object.fromEntries(
  Object.entries(AREA_BY_SETTING).map(([setting, area]) => [area, setting]),
) as Record<AreaCode, SettingId>

/** 선택한 첨삭 영역만 서버 설정 형식으로 바꾼다. */
export function toAreaSettings(settings: FeedbackSetting[]): AreaSetting[] {
  return settings
    .filter((setting) => setting.selected)
    .map((setting) => ({ area: AREA_BY_SETTING[setting.id], level: setting.level === 'Advanced' ? 'ADVANCED' : 'STANDARD' }))
}

/** 서버 좌표(0~1)를 화면 좌표(0~100%)로 바꾼다. */
export function regionToBox(region: RegionDto): Box {
  return { left: region.x * 100, top: region.y * 100, width: region.width * 100, height: region.height * 100 }
}

export function boxToRegion(box: Box, pageId: number): RegionDto {
  return {
    pageId,
    x: box.left / 100,
    y: box.top / 100,
    width: box.width / 100,
    height: box.height / 100,
    polygon: null,
  }
}

/**
 * 오류 수정/개선 제안 구분.
 * 응답에 feedbackType이 오면 그 값을 쓰고, 아직 없으면 영역으로 추정한다
 * (문법·문장 구성은 오류 수정, 어휘·내용은 개선 제안).
 */
function kindOf(correction: CorrectionDto): FeedbackKind {
  if (correction.feedbackType) return correction.feedbackType === 'SUGGESTION' ? 'improvement' : 'correction'
  return correction.area === 'VOCABULARY_EXPRESSION' || correction.area === 'CONTENT_SUMMARY' ? 'improvement' : 'correction'
}

/** 현재 페이지의 활성 첨삭만 화면 데이터로 바꾼다. 위치는 첫 번째 영역을 쓴다. */
export function toAiFeedback(corrections: CorrectionDto[], pageId: number): AiFeedback[] {
  return corrections
    .filter((correction) => correction.status === 'ACTIVE')
    .filter((correction) => correction.regions.length === 0 || correction.regions.some((region) => region.pageId === pageId))
    .map((correction, index) => {
      const region = correction.regions.find((item) => item.pageId === pageId)
      const mark = region ? regionToBox(region) : null
      const settingId = SETTING_BY_AREA[correction.area]
      return {
        id: String(correction.id),
        kind: kindOf(correction),
        category: BASE_SETTINGS.find((setting) => setting.id === settingId)?.en ?? correction.area,
        original: correction.originalText,
        suggestion: correction.content,
        reason: correction.explanation,
        markStyle: 'highlight',
        mark,
        noteText: correction.content,
        // 코멘트가 겹치지 않도록 사진 오른쪽과 왼쪽에 번갈아 둔다.
        notePlacement: { side: index % 2 === 0 ? 'right' : 'left', top: mark?.top ?? 0, mobileTop: mark?.top ?? 0 },
        notePosition: null,
        etag: correction.etag,
      }
    })
}

const STYLE_BY_HIGHLIGHT: Record<HighlightType, AnnotationStyle> = { HIGHLIGHT: 'highlight', UNDERLINE: 'underline' }

/** 서버가 저장할 수 있는 교사 표시 종류. 나머지는 화면에서만 쓴다. */
export function toHighlightType(style: AnnotationStyle): HighlightType | null {
  if (style === 'highlight') return 'HIGHLIGHT'
  if (style === 'underline') return 'UNDERLINE'
  return null
}

export function toTeacherComments(comments: CommentDto[], pageId: number): TeacherComment[] {
  return comments
    .filter((comment) => comment.pageId === pageId && comment.regions.length > 0)
    .map((comment) => ({
      id: `server-${comment.id}`,
      text: comment.content,
      style: STYLE_BY_HIGHLIGHT[comment.highlightType] ?? 'highlight',
      // 색은 아직 서버에 저장하지 않아 기본색으로 보여준다.
      color: 'blue',
      box: { ...regionToBox(comment.regions[0]), reverse: false },
      note: null,
      serverId: String(comment.id),
      etag: comment.etag,
    }))
}
