import { Link, type LinkProps } from 'react-router'
import { buttonBaseClasses, buttonBorderClasses, buttonStateClasses, type ButtonState } from './ButtonStyles'

export type CTAButtonProps = Omit<LinkProps, 'state'> & {
  state?: ButtonState
  disabled?: boolean
  /** Router location state; `state` is reserved for the visual button state. */
  navigationState?: unknown
}

export default function CTAButton({
  to,
  state = 'primary',
  disabled = false,
  navigationState,
  className = '',
  children = '새 첨삭 시작 →',
  ...props
}: CTAButtonProps) {
  const isDisabled = disabled || state === 'disabled'
  const resolvedState = isDisabled ? 'disabled' : state
  const classes = [
    buttonBaseClasses,
    'px-ds-24 py-ds-12 text-label1-semibold',
    buttonStateClasses[resolvedState],
    isDisabled ? `cursor-not-allowed border border-solid ${buttonBorderClasses.disabled}` : 'cursor-pointer',
    className,
  ].join(' ')

  if (isDisabled) {
    return (
      <span
        id={props.id}
        title={props.title}
        role="link"
        aria-disabled="true"
        aria-label={props['aria-label']}
        aria-describedby={props['aria-describedby']}
        className={classes}
      >
        {children}
      </span>
    )
  }

  return <Link {...props} to={to} state={navigationState} className={classes}>{children}</Link>
}
