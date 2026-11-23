import { ApiError, authHeader, request } from './client'

export type GenerationStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
export type GenerationStage = 'QUEUED' | 'OCR' | 'AI_CORRECTION' | 'COMPLETED'

export type Generation = {
  id: number
  status: GenerationStatus
  stage: GenerationStage
  /** 실패했을 때 안내 문구와 재시도 가능 여부 */
  error: { message: string; retryable: boolean } | null
}

const STATUSES: readonly string[] = ['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED']
const STAGES: readonly string[] = ['QUEUED', 'OCR', 'AI_CORRECTION', 'COMPLETED']

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
          message: typeof error.message === 'string' && error.message ? error.message : '첨삭을 만들지 못했어요.',
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
