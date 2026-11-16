import { useRef, useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import ActionButton from '../../../components/common/ActionButton'
import TextField from '../../../components/common/TextField'
import checkedIcon from '../../../assets/login/checkbox-checked.svg'
import uncheckedIcon from '../../../assets/login/checkbox-unchecked.svg'
import { LOGIN_SUPPORT } from '../constants'
import { readRememberedEmail, saveRememberedEmail } from '../rememberedEmail'

type FieldErrors = { email?: string; password?: string }

const fieldClasses = '[&_input]:font-medium [&>div]:rounded-ds-small [&>div:focus-within]:outline-2 [&>div:focus-within]:outline-offset-2 [&>div:focus-within]:outline-border-focused'

export default function LoginForm() {
  const navigate = useNavigate()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState(readRememberedEmail)
  const [password, setPassword] = useState('')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = '이메일을 입력해주세요.'
    else if (emailRef.current?.validity.typeMismatch) nextErrors.email = '올바른 이메일 형식으로 입력해주세요.'
    if (!password) nextErrors.password = '비밀번호를 입력해주세요.'
    setErrors(nextErrors)

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    saveRememberedEmail(email.trim(), rememberEmail)
    // API 연동 시 아래 이동은 인증 성공 응답 이후 실행한다.
    navigate('/main', { replace: true })
  }

  return (
    <div className="flex w-[416px] max-w-full flex-col gap-ds-48">
      <header className="flex flex-col gap-ds-8">
        <h1 id="login-heading" className="text-h1 text-text-neutral-default">로그인</h1>
        <p className="text-body1-regular text-text-neutral-muted">AUTEDI에 오신 것을 환영합니다</p>
      </header>

      <form noValidate aria-labelledby="login-heading" onSubmit={handleSubmit} className="flex flex-col gap-ds-48">
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
              placeholder="이메일을 입력해주세요."
              value={email}
              onValueChange={value => {
                setEmail(value)
                setErrors(previous => ({ ...previous, email: undefined }))
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
              placeholder="비밀번호를 입력해주세요."
              value={password}
              onValueChange={value => {
                setPassword(value)
                setErrors(previous => ({ ...previous, password: undefined }))
              }}
              error={errors.password}
              state="default"
              showPasswordToggle
              fullWidth
              className={fieldClasses}
            />
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-ds-4 text-label2-medium text-text-neutral-subtle">
            <span className="relative inline-flex size-ds-16 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                name="rememberEmail"
                checked={rememberEmail}
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

        <ActionButton type="submit" size="lg" className="w-full rounded-ds-small">로그인</ActionButton>
      </form>

      <p className="text-center text-caption text-text-neutral-subtle">
        로그인에 문제가 있으신가요?{' '}
        <a href={`mailto:${LOGIN_SUPPORT.email}`} className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused">운영팀에 문의해주세요.</a>
      </p>
    </div>
  )
}
