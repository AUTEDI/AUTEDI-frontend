// 서버가 페이지 이미지로 바꿀 수 있는 사진 형식과 최대 용량(디자인 기준 20MB)
export const PHOTO_TYPES = ['image/jpeg', 'image/png']
const MAX_PHOTO_BYTES = 20 * 1024 * 1024

/** 올릴 수 없는 사진이면 안내 문구를, 괜찮으면 null을 돌려준다. */
export function photoError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'JPG, JPEG, PNG 형식의 파일만 업로드 가능합니다.'
  if (file.size > MAX_PHOTO_BYTES) return '파일 최대 용량은 20MB예요.'
  return null
}
