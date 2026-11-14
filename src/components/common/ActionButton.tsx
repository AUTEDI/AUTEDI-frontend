import type { ComponentPropsWithRef } from 'react'
import { buttonBaseClasses, buttonBorderClasses, buttonStateClasses, type ButtonState } from './ButtonStyles'

export type ActionButtonProps = ComponentPropsWithRef<'button'> & {
  size?: 'sm' | 'md'
  state?: ButtonState
}

const sizeClasses = {
  sm: 'h-[30px] gap-ds-12 px-ds-16 py-ds-4 text-label2-semibold',
  md: 'h-[42px] px-ds-24 py-ds-8 text-label1-semibold',
} as const

export default function ActionButton({
  size = 'sm',
  state = 'primary',
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
        'border border-solid',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        sizeClasses[size],
        buttonStateClasses[resolvedState],
        buttonBorderClasses[resolvedState],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
