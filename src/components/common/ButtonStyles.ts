export type ButtonState = 'primary' | 'hover' | 'pressed' | 'disabled'

export const buttonBaseClasses =
  'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-ds-medium font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused'

export const buttonStateClasses = {
  primary:
    'bg-action-primary text-text-neutral-inverse hover:bg-action-hover active:bg-action-pressed',
  hover: 'bg-action-hover text-text-neutral-inverse active:bg-action-pressed',
  pressed: 'bg-action-pressed text-text-neutral-inverse',
  disabled: 'bg-action-disabled text-text-neutral-subtle',
} as const satisfies Record<ButtonState, string>

export const buttonBorderClasses = {
  primary: 'border-action-primary hover:border-action-hover active:border-action-pressed',
  hover: 'border-action-hover active:border-action-pressed',
  pressed: 'border-action-pressed',
  disabled: 'border-border-disabled',
} as const satisfies Record<ButtonState, string>
