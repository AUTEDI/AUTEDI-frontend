import { apiClient, ApiError, authHeader, request } from './client'

/**
 * 학습지 사진 한 장을 올린다. worksheetId가 없으면 새 작업을 만들고, 있으면 그 작업의 사진을 바꾼다.
 * shortcut: 업로드 필드 이름을 'file'로 가정했다, Swagger가 열리면 실제 필드명으로 맞춘다.
 */
export async function uploadWorksheetPhoto(file: File, worksheetId: number | null): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  await request(
    {
      method: worksheetId === null ? 'post' : 'put',
      url: worksheetId === null ? '/api/v1/worksheets' : `/api/v1/worksheets/${worksheetId}/file`,
      data: form,
      // 기본 JSON 헤더를 덮어써야 axios가 FormData를 JSON으로 바꾸지 않고 boundary를 붙여 보낸다.
      headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
      // 휴대폰 회선에서 큰 사진을 올릴 시간을 넉넉히 준다.
      timeout: 60000,
    },
    '사진을 올리지 못했어요. 다시 시도해 주세요.',
  )
}

/** 작업의 원본 사진을 받아 미리보기용 주소(blob URL)로 돌려준다. 다 쓰면 URL.revokeObjectURL로 해제한다. */
export async function getWorksheetImageUrl(worksheetId: number): Promise<string> {
  try {
    // 인증 헤더가 필요해 <img src>로 바로 걸 수 없으므로 파일로 받아 온다.
    const { data } = await apiClient.get<Blob>(`/api/v1/worksheets/${worksheetId}/file`, {
      headers: authHeader(),
      responseType: 'blob',
    })
    return URL.createObjectURL(data)
  } catch (error) {
    throw new ApiError('휴대폰에서 올린 사진을 불러오지 못했어요.', { cause: error })
  }
}
