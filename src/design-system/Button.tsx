import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
    fullWidth?: boolean
  }
>

export function Button({
  children,
  className = '',
  fullWidth = false,
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button-${variant}${fullWidth ? ' button-full' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  )
}
