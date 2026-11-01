import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'applied'
type ButtonSize = 'lg' | 'md' | 'sm' | 'xs'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary-gradient px-[17px] text-white shadow-primary',
  secondary: 'border border-[#dfe1ea] bg-white px-4 text-[#666c80]',
  danger: 'border border-[#ead8dc] bg-white px-4 text-[#aa5b68]',
  applied: 'bg-[linear-gradient(135deg,#279478,#14725f)] px-[17px] text-white shadow-[0_9px_20px_rgba(23,121,97,0.2)]',
}

const sizeClass: Record<ButtonSize, string> = {
  lg: 'h-10',
  md: 'h-[38px]',
  sm: 'h-[37px]',
  xs: 'h-[35px]',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'secondary', size = 'lg', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-[10px] text-center text-[10px] font-[750] whitespace-nowrap',
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      type={type}
      {...props}
    />
  )
}
