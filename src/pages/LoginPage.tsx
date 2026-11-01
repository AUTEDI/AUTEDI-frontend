import { useState, type FormEvent } from 'react'
import { Button } from '../components/common/Button'
import { useAuthStore } from '../stores/useAuthStore'

const INPUT =
  'h-10 w-full rounded-[10px] border border-[#dfe1ea] bg-white px-3 text-[11px] outline-none focus:border-[#7684e8] focus:shadow-[0_0_0_3px_#eef0ff]'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요.')
      return
    }
    setSubmitting(true)
    setError(await login(email.trim(), password))
    setSubmitting(false)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(160deg,#181b2f_0%,#111423_62%,#18234e_100%)] px-4">
      <form
        className="w-[min(380px,100%)] animate-fade-page rounded-[20px] bg-white p-7 shadow-modal"
        noValidate
        onSubmit={submit}
      >
        <div className="mb-6 flex items-center gap-[10px]">
          <span className="grid size-8 place-items-center rounded-[10px] bg-[linear-gradient(135deg,#8985ff,#4055d4)] font-serif text-[19px] font-bold text-white shadow-[0_8px_24px_rgba(73,80,214,0.38)]">
            A
          </span>
          <b className="font-[850] tracking-[1.8px]">AUTEDI</b>
        </div>
        <h1 className="mb-1.5 text-[21px] tracking-[-0.8px]">선생님 로그인</h1>
        <p className="mb-5 text-[9px] text-[#8a8fa0]">학원에서 받은 계정으로 로그인하세요.</p>
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[8px] font-extrabold text-[#70768a]">이메일</span>
          <input
            autoComplete="email"
            className={INPUT}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[8px] font-extrabold text-[#70768a]">비밀번호</span>
          <input
            autoComplete="current-password"
            className={INPUT}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            value={password}
          />
        </label>
        {error && (
          <p className="mb-3 rounded-lg bg-[#fff5f7] px-3 py-2 text-[9px] text-[#c53843]" role="alert">
            {error}
          </p>
        )}
        <Button className="w-full disabled:opacity-60" disabled={submitting} type="submit" variant="primary">
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </main>
  )
}
