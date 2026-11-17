import type { ComponentPropsWithRef } from 'react'
import { buttonBaseClasses, buttonBorderClasses, buttonStateClasses, type ButtonState } from './ButtonStyles'

export type ActionButtonProps = ComponentPropsWithRef<'button'> & {
  size?: 'sm' | 'md' | 'lg'
  state?: ButtonState
  /** primary는 파란 확인 버튼, secondary는 흰 바탕의 취소·삭제 버튼 */
  variant?: 'primary' | 'secondary'
}

const sizeClasses = {
  sm: 'h-[30px] gap-ds-12 px-ds-16 py-ds-4 text-label2-semibold',
  md: 'h-[42px] px-ds-24 py-ds-8 text-label1-semibold',
  lg: 'h-ds-48 px-ds-24 py-ds-12 text-label1-semibold',
} as const

const secondaryClasses = {
  primary:
    'border-border-default bg-background-neutral-default text-text-neutral-default hover:bg-background-neutral-weak active:bg-background-neutral-subtle',
  hover: 'border-border-default bg-background-neutral-weak text-text-neutral-default active:bg-background-neutral-subtle',
  pressed: 'border-border-default bg-background-neutral-subtle text-text-neutral-default',
  disabled: `${buttonStateClasses.disabled} ${buttonBorderClasses.disabled}`,
} as const satisfies Record<ButtonState, string>

export default function ActionButton({
  size = 'sm',
  state = 'primary',
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  const isDisabled = disabled || state === 'disabled'
  const resolvedState = isDisabled ? 'disabled' : state

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      className={[
        buttonBaseClasses,
        'rounded-ds-small border border-solid',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        sizeClasses[size],
        variant === 'secondary'
          ? secondaryClasses[resolvedState]
          : `${buttonStateClasses[resolvedState]} ${buttonBorderClasses[resolvedState]}`,
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
