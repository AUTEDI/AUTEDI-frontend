import { BASE_SETTINGS } from '../constants/settings'
import type {
  AiFeedback,
  AnnotationColor,
  AnnotationStyle,
  Box,
  FeedbackKind,
  FeedbackSetting,
  ReviewData,
  SettingId,
  TeacherComment,
} from '../types/review'
import type {
  AreaCode,
  AreaSetting,
  CommentColor,
  CommentDto,
  CorrectionDto,
  HighlightType,
  RegionDto,
  ReviewDto,
} from './types'

const AREA_BY_SETTING: Record<SettingId, AreaCode> = {
  grammar: 'GRAMMAR_SPELLING',
  vocabulary: 'VOCABULARY_EXPRESSION',
  structure: 'SENTENCE_STRUCTURE',
  content: 'CONTENT_SUMMARY',
}

const SETTING_BY_AREA: Record<AreaCode, SettingId> = {
  GRAMMAR_SPELLING: 'grammar',
  GRAMMAR_MECHANICS: 'grammar',
  VOCABULARY_EXPRESSION: 'vocabulary',
  SENTENCE_STRUCTURE: 'structure',
  CONTENT_SUMMARY: 'content',
}

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

/** pageId를 모르는 단일 페이지 응답이면 pageId 없이 보낸다. */
export function boxToRegion(box: Box, pageId: number | null): RegionDto {
  return {
    ...(pageId !== null ? { pageId } : {}),
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

/** 현재 페이지의 활성 첨삭을 변환한다. 페이지 정보가 없는 좌표는 단일 페이지에서만 그린다. */
export function toAiFeedback(corrections: CorrectionDto[], pageId: number | null, pageCount = 1): AiFeedback[] {
  return corrections
    .filter((correction) => correction.status === 'ACTIVE')
    .filter((correction) =>
      correction.regions.every((region) => region.pageId == null) ||
      correction.regions.some((region) => pageId !== null && region.pageId === pageId),
    )
    .map((correction, index) => {
      const scopedRegion = correction.regions.find((item) => pageId !== null && item.pageId === pageId)
      const unscopedRegion = pageCount === 1 && correction.regions.every((item) => item.pageId == null)
        ? correction.regions[0]
        : undefined
      const region = scopedRegion ?? unscopedRegion
      // 단위가 명시되지 않은 기존 응답도 0~1 좌표다. 다른 단위는 위치를 추측하지 않는다.
      const normalized = correction.regionCoordinateUnit == null || correction.regionCoordinateUnit === 'NORMALIZED_0_1'
      const mark = region && normalized ? regionToBox(region) : null
      const settingId = SETTING_BY_AREA[correction.area]
      return {
        id: String(correction.id),
        kind: kindOf(correction),
        category: BASE_SETTINGS.find((setting) => setting.id === settingId)?.en ?? correction.area,
        original: correction.originalText,
        suggestion: correction.content,
        reason: correction.explanation,
        mark,
        noteText: correction.content,
        // 코멘트가 겹치지 않도록 사진 오른쪽과 왼쪽에 번갈아 둔다.
        notePlacement: { side: index % 2 === 0 ? 'right' : 'left', top: mark?.top ?? 0, mobileTop: mark?.top ?? 0 },
        notePosition: null,
        etag: correction.etag,
      }
    })
}

const HIGHLIGHT_BY_STYLE: Record<AnnotationStyle, HighlightType> = {
  highlight: 'HIGHLIGHT',
  underline: 'UNDERLINE',
  strike: 'STRIKETHROUGH',
  arrow: 'ARROW',
  box: 'TEXTBOX',
  caret: 'CARET',
}

const STYLE_BY_HIGHLIGHT = Object.fromEntries(
  Object.entries(HIGHLIGHT_BY_STYLE).map(([style, highlight]) => [highlight, style]),
) as Record<HighlightType, AnnotationStyle>

/** 화면의 교사 표시 종류를 서버 값으로 바꾼다. */
export function toHighlightType(style: AnnotationStyle): HighlightType {
  return HIGHLIGHT_BY_STYLE[style]
}

const COMMENT_COLOR_BY_COLOR: Record<AnnotationColor, CommentColor> = {
  blue: 'BLUE',
  red: 'RED',
  yellow: 'YELLOW',
  green: 'GREEN',
}

export function toCommentColor(color: AnnotationColor): CommentColor {
  return COMMENT_COLOR_BY_COLOR[color]
}

function fromCommentColor(color: CommentColor | null | undefined): AnnotationColor {
  return (Object.entries(COMMENT_COLOR_BY_COLOR).find(([, value]) => value === color)?.[0] as AnnotationColor) ?? 'blue'
}

export function toTeacherComments(comments: CommentDto[], pageId: number): TeacherComment[] {
  return comments
    .filter((comment) => comment.pageId === pageId)
    .flatMap((comment): TeacherComment[] => {
      // 코멘트 자체의 pageId로 페이지가 확인되므로 영역의 pageId는 없어도 된다.
      const region = comment.regions.find((item) => item.pageId === pageId)
        ?? comment.regions.find((item) => item.pageId == null)
      if (!region) return []
      return [{
        id: `server-${comment.id}`,
        text: comment.content,
        style: STYLE_BY_HIGHLIGHT[comment.highlightType] ?? 'underline',
        color: fromCommentColor(comment.color),
        box: { ...regionToBox(region), reverse: false },
        note: null,
        serverId: String(comment.id),
        etag: comment.etag,
      }]
    })
}

/** 업로드에 포함된 결과와 GET /review 응답에 같은 변환을 적용한다. */
export function toReviewData(data: ReviewDto): ReviewData {
  const page = data.worksheet.pages[0]
  const feedback = toAiFeedback(data.corrections, page?.id ?? null, data.worksheet.pages.length)
  const applied = new Set(data.corrections.filter((item) => item.isApplied === true).map((item) => String(item.id)))
  return {
    worksheetId: data.worksheet.id,
    pageId: page?.id ?? null,
    imageUrl: page?.imageUrl ?? data.worksheet.file.originalUrl,
    feedback,
    appliedIds: feedback.filter((item) => applied.has(item.id)).map((item) => item.id),
    teacherComments: page ? toTeacherComments(data.comments, page.id) : [],
  }
}
