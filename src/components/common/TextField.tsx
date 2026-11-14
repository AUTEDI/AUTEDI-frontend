import { useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef } from 'react'
import clearIcon from '../../assets/design-system/44a04.svg'
import errorIcon from '../../assets/design-system/004b0.svg'

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
  id,
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
  const currentValue = value ?? internalValue
  const isDisabled = disabled || state === 'disabled'
  const hasError = Boolean(error) || state === 'error' || ariaInvalid === true || ariaInvalid === 'true'
  const automaticState = focused ? (currentValue ? 'typing' : 'tapped') : (currentValue ? 'entered' : 'default')
  const resolvedState = isDisabled ? 'disabled' : hasError ? 'error' : state ?? automaticState
  const errorId = error ? `${inputId}-error` : undefined
  const canClear = clearable && currentValue.length > 0 && !isDisabled && !readOnly

  useImperativeHandle(ref, () => inputRef.current!)

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <div className={`flex w-[240px] max-w-full flex-col gap-ds-4 ${className}`}>
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
          type={type}
          value={currentValue}
          placeholder={placeholder}
          disabled={isDisabled}
          readOnly={readOnly}
          aria-invalid={hasError ? true : ariaInvalid}
          aria-describedby={[describedBy, errorId].filter(Boolean).join(' ') || undefined}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-label2-semibold text-foreground-neutral-default caret-foreground-accent-green outline-none placeholder:text-foreground-neutral-subtle disabled:cursor-not-allowed disabled:text-foreground-neutral-subtle [&::-webkit-search-cancel-button]:appearance-none"
          onChange={event => updateValue(event.target.value)}
          onFocus={event => { setFocused(true); onFocus?.(event) }}
          onBlur={event => { setFocused(false); onBlur?.(event) }}
        />
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
        <p id={errorId} role="alert" className="flex items-start gap-ds-4 font-sans text-[length:var(--unit-10)] leading-[var(--line-height-18)] text-black">
          <img src={errorIcon} width="12" height="12" alt="" className="mt-[3px] shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
