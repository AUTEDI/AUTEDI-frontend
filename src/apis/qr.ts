import type { AuthSession } from '../types/auth'
import { isAuthSession } from './auth'
import { ApiError, authHeader, request } from './client'

export type QrSession = {
  /** 노트북만 쓰는 값. 승인/거절과 SSE 이벤트 구분에 쓴다. */
  sessionId: string
  /** <img src>에 바로 넣을 수 있는 data URL */
  qrImage: string
  /** 만료 시각(ms) */
  expiresAt: number
}

export type QrStatus = 'PENDING' | 'SCANNED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'EXPIRED'

/** 휴대폰 로그인 결과. worksheetId가 있으면 그 작업의 사진을 바꾸는 QR, null이면 첫 사진용 QR이다. */
export type QrLogin = { session: AuthSession; worksheetId: number | null }

const QR_LIFETIME_MS = 3 * 60 * 1000

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function toQrLogin(result: unknown): QrLogin {
  const { worksheetId, ...session } = asRecord(result)
  if (!isAuthSession(session) || (worksheetId != null && typeof worksheetId !== 'number')) {
    throw new ApiError('로그인 정보를 확인할 수 없어요. 노트북에서 QR을 다시 생성해 주세요.')
  }
  return { session, worksheetId: worksheetId ?? null }
}

/** 노트북: 첫 사진용 QR을 만든다. (사진 교체용 worksheetId는 교체 화면이 생기면 넘긴다) */
export async function createQrSession(): Promise<QrSession> {
  const result = asRecord(
    await request(
      { method: 'post', url: '/api/v1/auth/qr-sessions', data: {}, headers: authHeader() },
      'QR 코드를 만들지 못했어요. 다시 시도해 주세요.',
    ),
  )
  const { sessionId, qrImage, expiresAt } = result
  if (typeof sessionId !== 'string' || typeof qrImage !== 'string' || !qrImage.startsWith('data:image/')) {
    throw new ApiError('QR 코드를 확인할 수 없어요. 다시 시도해 주세요.')
  }
  const expiresAtMs = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN
  return { sessionId, qrImage, expiresAt: Number.isNaN(expiresAtMs) ? Date.now() + QR_LIFETIME_MS : expiresAtMs }
}

/** 노트북: 휴대폰 로그인 요청 허용 */
export async function approveQrSession(sessionId: string): Promise<void> {
  await request(
    { method: 'post', url: `/api/v1/auth/qr-sessions/${encodeURIComponent(sessionId)}/approve`, headers: authHeader() },
    '로그인 요청을 허용하지 못했어요. 다시 시도해 주세요.',
  )
}

/** 휴대폰: QR을 찍었다고 알린다. 서버가 노트북에 qr.scanned를 보낸다. */
export async function scanQr(qrToken: string): Promise<void> {
  await request(
    { method: 'post', url: '/api/v1/auth/qr-sessions/scan', data: { qrToken } },
    'QR을 확인하지 못했어요. 노트북에서 QR을 다시 생성해 주세요.',
  )
}

/** 휴대폰: 승인 상태 조회. qrToken이 주소에 남지 않게 POST로 보낸다. */
export async function getQrStatus(qrToken: string): Promise<QrStatus | string> {
  const { status } = asRecord(
    await request(
      { method: 'post', url: '/api/v1/auth/qr-sessions/status', data: { qrToken } },
      '승인 상태를 확인하지 못했어요.',
    ),
  )
  if (typeof status !== 'string') throw new ApiError('승인 상태를 확인하지 못했어요.')
  return status
}

/** 휴대폰: 승인된 QR로 토큰을 받는다. QR 하나당 한 번만 성공한다. */
export async function issueQrToken(qrToken: string): Promise<QrLogin> {
  return toQrLogin(
    await request(
      { method: 'post', url: '/api/v1/auth/qr-sessions/token', data: { qrToken } },
      '로그인하지 못했어요. 노트북에서 QR을 다시 생성해 주세요.',
    ),
  )
}

/** 휴대폰: 이미 같은 계정으로 로그인돼 있으면 노트북 승인 없이 연결한다. */
export async function linkQr(qrToken: string, accessToken: string): Promise<QrLogin> {
  return toQrLogin(
    await request(
      { method: 'post', url: '/api/v1/auth/qr-sessions/link', data: { qrToken }, headers: { Authorization: `Bearer ${accessToken}` } },
      '노트북과 연결하지 못했어요.',
    ),
  )
}
