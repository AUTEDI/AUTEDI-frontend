import { ApiError, authHeader, request } from './client'

export type GenerationStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
export type GenerationStage = 'QUEUED' | 'OCR' | 'AI_CORRECTION' | 'COMPLETED'

export type Generation = {
  id: number
  status: GenerationStatus
  stage: GenerationStage
  /** 실패했을 때 사용자용 실패 이유(서버 code로 정함)와 재시도 가능 여부 */
  error: { message: string; retryable: boolean } | null
}

const STATUSES: readonly string[] = ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED']
const STAGES: readonly string[] = ['QUEUED', 'OCR', 'AI_CORRECTION', 'COMPLETED']

// 서버 실패 코드 → 사용자에게 보여줄 실패 이유. 서버 message는 개발용이라 화면에 쓰지 않는다.
// shortcut: 코드 이름은 프론트 제안안이다, 백엔드가 실제 코드를 정하면 키를 맞춘다.
const FAILURE_MESSAGES: Readonly<Record<string, string>> = {
  OCR_EMPTY: '사진에서 글씨를 찾지 못했어요. 글씨가 잘 보이게 다시 찍어 주세요.',
  OCR_LOW_QUALITY: '사진이 흐리거나 어두워서 글씨를 읽기 어려워요. 밝은 곳에서 다시 찍어 주세요.',
  NOT_WORKSHEET: '학습지 사진이 아닌 것 같아요. 영어 작문이 담긴 사진을 올려 주세요.',
  UNSUPPORTED_LANGUAGE: '영어 작문만 첨삭할 수 있어요.',
  AI_TIMEOUT: '첨삭에 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
  AI_RATE_LIMITED: '지금 요청이 많아 첨삭을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
  AI_INVALID_RESPONSE: '첨삭 결과를 정리하다 문제가 생겼어요. 다시 시도해 주세요.',
  FILE_NOT_FOUND: '올린 사진을 찾지 못했어요. 처음부터 다시 올려 주세요.',
}
const UNKNOWN_FAILURE_MESSAGE = '알 수 없는 이유로 첨삭을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'

function toGeneration(result: unknown): Generation {
  const value = (result ?? {}) as Record<string, unknown>
  if (typeof value.id !== 'number' || typeof value.status !== 'string' || !STATUSES.includes(value.status)) {
    throw new ApiError('첨삭 생성 상태를 확인할 수 없어요. 다시 시도해 주세요.')
  }
  const stage = typeof value.stage === 'string' && STAGES.includes(value.stage) ? value.stage : 'QUEUED'
  const error = value.error as Record<string, unknown> | null | undefined
  return {
    id: value.id,
    status: value.status as GenerationStatus,
    stage: stage as GenerationStage,
    error: error
      ? {
          message: (typeof error.code === 'string' && FAILURE_MESSAGES[error.code]) || UNKNOWN_FAILURE_MESSAGE,
          retryable: error.retryable === true,
        }
      : null,
  }
}

/**
 * AI 첨삭 생성을 요청한다. 서버가 작업을 접수만 하고 바로 돌려주므로 진행은 getGeneration·SSE로 따라간다.
 * 같은 멱등키로 다시 보내면 새 작업을 만들지 않고 같은 작업을 돌려준다.
 */
export async function createGeneration(worksheetId: number, idempotencyKey: string, signal?: AbortSignal): Promise<Generation> {
  return toGeneration(
    await request(
      {
        method: 'post',
        url: `/api/v1/worksheets/${worksheetId}/generations`,
        headers: { ...authHeader(), 'Idempotency-Key': idempotencyKey },
        signal,
      },
      'AI 첨삭을 시작하지 못했어요. 다시 시도해 주세요.',
    ),
  )
}

export async function getGeneration(worksheetId: number, generationId: number): Promise<Generation> {
  return toGeneration(
    await request(
      { method: 'get', url: `/api/v1/worksheets/${worksheetId}/generations/${generationId}`, headers: authHeader() },
      '첨삭 생성 상태를 확인하지 못했어요.',
    ),
  )
}

/** 재시도할 수 있는 실패 작업을 다시 접수한다. 새 작업이 생기므로 돌려받은 작업을 따라간다. */
export async function retryGeneration(worksheetId: number, generationId: number, idempotencyKey: string): Promise<Generation> {
  return toGeneration(
    await request(
      {
        method: 'post',
        url: `/api/v1/worksheets/${worksheetId}/generations/${generationId}/retry`,
        headers: { ...authHeader(), 'Idempotency-Key': idempotencyKey },
      },
      'AI 첨삭을 다시 시작하지 못했어요. 다시 시도해 주세요.',
    ),
  )
}
