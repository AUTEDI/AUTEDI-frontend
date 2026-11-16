import { useRef, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import { login } from '../../../apis/auth'
import ActionButton from '../../../components/common/ActionButton'
import TextField from '../../../components/common/TextField'
import checkedIcon from '../../../assets/login/checkbox-checked.svg'
import uncheckedIcon from '../../../assets/login/checkbox-unchecked.svg'
import { LOGIN_SUPPORT } from '../constants'
import { readRememberedEmail, saveRememberedEmail } from '../rememberedEmail'
import { useAuthStore } from '../../../stores/useAuthStore'

type FieldErrors = { email?: string; password?: string }

const fieldClasses = '[&_input]:font-medium [&>div]:rounded-ds-small [&>div:focus-within]:outline-2 [&>div:focus-within]:outline-offset-2 [&>div:focus-within]:outline-border-focused'

export default function LoginForm() {
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const setSession = useAuthStore(state => state.setSession)
  const [email, setEmail] = useState(readRememberedEmail)
  const [password, setPassword] = useState('')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = '이메일을 입력해주세요.'
    else if (emailRef.current?.validity.typeMismatch) nextErrors.email = '올바른 이메일 형식으로 입력해주세요.'
    if (!password) nextErrors.password = '비밀번호를 입력해주세요.'
    setErrors(nextErrors)
    setSubmitError('')

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const session = await login({ email: email.trim(), password })
      saveRememberedEmail(email.trim(), rememberEmail)
      setSession(session)
      navigate('/main', { replace: true })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '로그인하지 못했어요. 다시 시도해주세요.')
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex w-[416px] max-w-full flex-col gap-ds-48">
      <header className="flex flex-col gap-ds-8">
        <h1 id="login-heading" className="text-h1 text-text-neutral-default">로그인</h1>
        <p className="text-body1-regular text-text-neutral-muted">AUTEDI에 오신 것을 환영합니다</p>
      </header>

      <form noValidate aria-labelledby="login-heading" aria-busy={isSubmitting} onSubmit={handleSubmit} className="flex flex-col gap-ds-48">
        <div className="flex flex-col gap-ds-20">
          <div className="flex flex-col gap-ds-10">
            <label id="login-email-label" htmlFor="login-email" className="text-body1-semibold text-text-neutral-muted">이메일</label>
            <TextField
              ref={emailRef}
              id="login-email"
              name="email"
              label="이메일"
              aria-labelledby="login-email-label"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={isSubmitting}
              placeholder="이메일을 입력해주세요."
              value={email}
              onValueChange={value => {
                setEmail(value)
                setErrors(previous => ({ ...previous, email: undefined }))
                setSubmitError('')
              }}
              error={errors.email}
              clearable={false}
              state="default"
              fullWidth
              className={fieldClasses}
            />
          </div>

          <div className="flex flex-col gap-ds-10">
            <label id="login-password-label" htmlFor="login-password" className="text-body2-semibold text-text-neutral-muted">비밀번호</label>
            <TextField
              ref={passwordRef}
              id="login-password"
              name="password"
              label="비밀번호"
              aria-labelledby="login-password-label"
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              placeholder="비밀번호를 입력해주세요."
              value={password}
              onValueChange={value => {
                setPassword(value)
                setErrors(previous => ({ ...previous, password: undefined }))
                setSubmitError('')
              }}
              error={errors.password}
              state="default"
              showPasswordToggle
              fullWidth
              className={fieldClasses}
            />
          </div>

          <label className={`flex w-fit items-center gap-ds-4 text-label2-medium text-text-neutral-subtle ${isSubmitting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className="relative inline-flex size-ds-16 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                name="rememberEmail"
                checked={rememberEmail}
                disabled={isSubmitting}
                onChange={event => {
                  const checked = event.target.checked
                  setRememberEmail(checked)
                  if (!checked) saveRememberedEmail('', false)
                }}
                className="peer sr-only"
              />
              <img src={rememberEmail ? checkedIcon : uncheckedIcon} alt="" className="rounded-[2px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-focused" />
            </span>
            아이디 저장
          </label>
        </div>

        <div className="flex flex-col gap-ds-12">
          <ActionButton type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-ds-small">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </ActionButton>
          {submitError && <p role="alert" className="text-center text-caption text-text-accent-red">{submitError}</p>}
        </div>
      </form>

      <p className="text-center text-caption text-text-neutral-subtle">
        로그인에 문제가 있으신가요?{' '}
        <a href={`mailto:${LOGIN_SUPPORT.email}`} className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused">운영팀에 문의해주세요.</a>
      </p>
    </div>
  )
}
