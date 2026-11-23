import { useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef } from 'react'
import clearIcon from '../../assets/design-system/44a04.svg'
import errorIcon from '../../assets/design-system/004b0.svg'
import eyeHiddenIcon from '../../assets/design-system/icon-eye-hidden.svg'
import eyeVisibleIcon from '../../assets/design-system/icon-eye-visible.svg'

export type TextFieldState = 'default' | 'tapped' | 'typing' | 'entered' | 'error' | 'disabled'

export type TextFieldProps = Omit<
  ComponentPropsWithRef<'input'>,
  'size' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'children'
> & {
  label: string
  showLabel?: boolean
  type?: 'text' | 'search' | 'email' | 'url' | 'tel' | 'password'
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  state?: TextFieldState
  error?: string
  clearable?: boolean
  /** 비밀번호 입력에 표시·숨김 버튼을 제공한다. 지우기 버튼 대신 표시된다. */
  showPasswordToggle?: boolean
  /** 부모 너비를 채운다. 기본 너비는 240px이다. */
  fullWidth?: boolean
}

const stateClasses = {
  default: 'border-border-default bg-background-neutral-default',
  tapped: 'border-border-default bg-background-neutral-default',
  typing: 'border-border-default bg-background-neutral-default',
  entered: 'border-border-focused bg-background-neutral-default',
  error: 'border-border-error bg-background-neutral-default',
  disabled: 'border-border-disabled bg-background-neutral-disabled',
} as const satisfies Record<TextFieldState, string>

export default function TextField({
  label,
  showLabel = false,
  type = 'text',
  value,
  defaultValue = '',
  onValueChange,
  state,
  error,
  clearable = true,
  showPasswordToggle = false,
  fullWidth = false,
  id,
  form,
  ref,
  className = '',
  disabled = false,
  readOnly = false,
  placeholder = '제목을 입력해주세요.',
  onFocus,
  onBlur,
  'aria-invalid': ariaInvalid,
  'aria-describedby': describedBy,
  ...props
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [focused, setFocused] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const currentValue = value ?? internalValue
  const isDisabled = disabled || state === 'disabled'
  const hasError = Boolean(error) || state === 'error' || ariaInvalid === true || ariaInvalid === 'true'
  const automaticState = focused ? (currentValue ? 'typing' : 'tapped') : (currentValue ? 'entered' : 'default')
  const resolvedState = isDisabled ? 'disabled' : hasError ? 'error' : state ?? automaticState
  const errorId = error ? `${inputId}-error` : undefined
  const canTogglePassword = type === 'password' && showPasswordToggle
  const passwordVisible = canTogglePassword && isPasswordVisible
  const canClear = clearable && !canTogglePassword && currentValue.length > 0 && !isDisabled && !readOnly

  useImperativeHandle(ref, () => inputRef.current!)

  useEffect(() => {
    if (value !== undefined) return
    const ownerForm = inputRef.current?.form
    function handleReset(event: Event) {
      // 부모의 onReset에서 preventDefault()로 취소할 수 있도록 이벤트 종료 후 복원합니다.
      queueMicrotask(() => {
        if (!event.defaultPrevented) setInternalValue(defaultValue)
      })
    }
    ownerForm?.addEventListener('reset', handleReset)
    return () => ownerForm?.removeEventListener('reset', handleReset)
  }, [defaultValue, value, form])

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <div className={`flex max-w-full flex-col gap-ds-4 ${fullWidth ? 'w-full' : 'w-[240px]'} ${className}`}>
      <label htmlFor={inputId} className={showLabel ? 'text-label2-medium' : 'sr-only'}>{label}</label>
      <div
        data-state={resolvedState}
        className={[
          'flex h-[42px] items-center gap-ds-10 rounded-ds-medium border border-solid px-ds-12 py-ds-10',
          stateClasses[resolvedState],
          isDisabled ? 'cursor-not-allowed' : '',
        ].join(' ')}
      >
        <input
          {...props}
          ref={inputRef}
          id={inputId}
          form={form}
          type={passwordVisible ? 'text' : type}
          value={currentValue}
          placeholder={placeholder}
          disabled={isDisabled}
          readOnly={readOnly}
          aria-invalid={hasError ? true : ariaInvalid}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(' ') || undefined}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-label2-semibold text-text-neutral-default caret-text-accent-green outline-none placeholder:text-text-neutral-subtle disabled:cursor-not-allowed disabled:text-text-neutral-subtle [&::-webkit-search-cancel-button]:appearance-none"
          onChange={event => updateValue(event.target.value)}
          onFocus={event => { setFocused(true); onFocus?.(event) }}
          onBlur={event => { setFocused(false); onBlur?.(event) }}
        />
        {canTogglePassword && (
          <button
            type="button"
            aria-label={`${label} ${passwordVisible ? '숨기기' : '표시'}`}
            aria-controls={inputId}
            aria-pressed={passwordVisible}
            disabled={isDisabled}
            className="relative inline-flex size-ds-16 shrink-0 cursor-pointer items-center justify-center rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused disabled:cursor-not-allowed disabled:opacity-40"
            onMouseDown={event => event.preventDefault()}
            onClick={() => setIsPasswordVisible(visible => !visible)}
          >
            <img
              src={passwordVisible ? eyeVisibleIcon : eyeHiddenIcon}
              alt=""
              className={passwordVisible ? 'absolute top-[3.375px] left-[1.375px] max-w-none' : 'max-w-none'}
            />
          </button>
        )}
        {canClear && (
          <button
            type="button"
            aria-label={`${label} 지우기`}
            className="inline-flex size-ds-16 shrink-0 cursor-pointer items-center justify-center rounded-ds-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
            onMouseDown={event => event.preventDefault()}
            onClick={() => { updateValue(''); inputRef.current?.focus() }}
          >
            <img src={clearIcon} width="16" height="16" alt="" />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-ds-4 font-sans text-[length:var(--unit-10)] leading-[var(--line-height-18)] text-text-accent-red">
          <img src={errorIcon} width="12" height="12" alt="" className="mt-[3px] shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
