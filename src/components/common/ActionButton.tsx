import type { ComponentPropsWithRef } from 'react'
import { buttonBaseClasses, buttonBorderClasses, buttonStateClasses, type ButtonState } from './ButtonStyles'

export type ActionButtonProps = ComponentPropsWithRef<'button'> & {
  size?: 'sm' | 'md' | 'lg'
  state?: ButtonState
  /** primary는 파란 확인 버튼, secondary는 흰 바탕의 취소·삭제 버튼, neutral은 카드 안의 회색 확인·저장 버튼 */
  variant?: 'primary' | 'secondary' | 'neutral'
}

const sizeClasses = {
  sm: 'h-[30px] gap-ds-12 px-ds-16 py-ds-4 text-label2-semibold',
  md: 'h-[42px] px-ds-24 py-ds-8 text-label1-semibold',
  lg: 'h-ds-48 px-ds-24 py-ds-12 text-label1-semibold',
} as const

const secondaryClasses = {
  primary:
    'border-border-neutral-default bg-background-neutral-default text-text-neutral-default hover:bg-background-neutral-weak active:bg-background-neutral-subtle',
  hover: 'border-border-neutral-default bg-background-neutral-weak text-text-neutral-default active:bg-background-neutral-subtle',
  pressed: 'border-border-neutral-default bg-background-neutral-subtle text-text-neutral-default',
  disabled: `${buttonStateClasses.disabled} ${buttonBorderClasses.disabled}`,
} as const satisfies Record<ButtonState, string>

const neutralClasses = {
  primary: 'border-background-neutral-secondary bg-background-neutral-secondary text-text-neutral-inverse hover:border-ds-gray-600 hover:bg-ds-gray-600 active:bg-ds-gray-700',
  hover: 'border-ds-gray-600 bg-ds-gray-600 text-text-neutral-inverse active:bg-ds-gray-700',
  pressed: 'border-ds-gray-700 bg-ds-gray-700 text-text-neutral-inverse',
  disabled: secondaryClasses.disabled,
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
        variant === 'secondary' ? secondaryClasses[resolvedState]
        : variant === 'neutral' ? neutralClasses[resolvedState]
        : `${buttonStateClasses[resolvedState]} ${buttonBorderClasses[resolvedState]}`,
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
