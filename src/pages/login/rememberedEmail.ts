const REMEMBERED_EMAIL_KEY = 'autedi.rememberedEmail'

export function readRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveRememberedEmail(email: string, remember: boolean): void {
  try {
    if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY)
  } catch {
    // 저장소를 사용할 수 없어도 입력과 폼 제출은 계속할 수 있다.
  }
}
