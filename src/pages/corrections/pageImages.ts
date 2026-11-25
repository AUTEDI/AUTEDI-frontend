import { getPageImageUrl, type ReviewPage } from '../../apis/review'
import { getWorksheetFile } from '../../apis/worksheets'

// 업로드할 때 고른 원본 사진(올린 순서 = 페이지 순서). 검토 화면이 같은 사진을 다시 받지 않도록 이 탭에 잠시 둔다.
// 새로고침하면 사라지고, 그때는 서버에서 받는다.
const uploadedFiles = new Map<number, readonly File[]>()

export function rememberUploadedFiles(worksheetId: number, files: readonly File[]) {
  uploadedFiles.set(worksheetId, files)
}

// 원본과 보정 PNG의 픽셀 크기가 이만큼(px) 안에서 같으면 같은 방향·크기로 본다.
const SIZE_TOLERANCE = 2

/** 사진이 페이지(보정 PNG)와 방향·크기가 같은지. 좌표(0~1)를 그대로 쓰려면 같아야 한다. 브라우저는 EXIF 회전을 적용해 크기를 잰다. */
async function matchesPage(url: string, page: ReviewPage) {
  const image = new Image()
  image.src = url
  await image.decode()
  return Math.abs(image.naturalWidth - page.width) <= SIZE_TOLERANCE && Math.abs(image.naturalHeight - page.height) <= SIZE_TOLERANCE
}

/**
 * 검토 화면의 페이지 사진 주소(blob:)를 가볍고 빠른 것부터 받는다.
 * 1) 업로드 직후 이 탭에 남아 있는 원본 → 2) 서버 원본 파일(/file, 페이지가 하나일 때만) → 3) 보정 PNG(pages/{n}/image, 크고 느림).
 * 1·2는 방향·크기가 페이지와 다르면 버리고 다음으로 넘어간다. 3까지 실패하면 에러를 던진다.
 */
export async function loadPageImage(worksheetId: number, page: ReviewPage, pageCount: number): Promise<string> {
  const candidates: (() => Promise<Blob>)[] = []
  const uploaded = uploadedFiles.get(worksheetId)?.[page.pageNumber - 1]
  if (uploaded) candidates.push(async () => uploaded)
  // shortcut: /file은 학습지 원본 파일 하나라, 여러 장 학습지는 어느 페이지인지 알 수 없어 보정 PNG로 받는다, 페이지별 원본 API가 생기면 바꾼다.
  if (pageCount === 1) candidates.push(() => getWorksheetFile(worksheetId))

  for (const candidate of candidates) {
    let url: string | undefined
    try {
      url = URL.createObjectURL(await candidate())
      if (await matchesPage(url, page)) return url
    } catch {
      // 다음 후보로 넘어간다.
    }
    if (url) URL.revokeObjectURL(url)
  }
  return getPageImageUrl(worksheetId, page.pageNumber)
}
