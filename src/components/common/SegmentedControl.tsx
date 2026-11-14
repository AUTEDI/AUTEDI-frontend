import { useId, useState } from 'react'

export type SegmentedControlOption<T extends string = string> = {
  value: T
  label: string
  disabled?: boolean
}

export type SegmentedControlProps<T extends string = string> = {
  /** 스크린리더용 그룹 이름 */
  label: string
  options?: readonly SegmentedControlOption<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  /** form 제출 시 사용할 이름 */
  name?: string
  disabled?: boolean
  className?: string
}

const defaultOptions = [
  { value: 'standard', label: 'Standard' },
  { value: 'advanced', label: 'Advanced' },
] as const satisfies readonly SegmentedControlOption[]

export default function SegmentedControl<T extends string = string>({
  label,
  options = defaultOptions as unknown as readonly SegmentedControlOption<T>[],
  value,
  defaultValue,
  onValueChange,
  name,
  disabled = false,
  className = '',
}: SegmentedControlProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue ?? options[0]?.value)
  const selectedValue = value ?? internalValue

  function select(nextValue: T) {
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`flex w-[240px] max-w-full items-center justify-center gap-ds-4 overflow-clip rounded-ds-medium border border-solid border-border-default bg-background-neutral-default p-ds-4 ${className}`}
    >
      {options.map(option => {
        const isSelected = option.value === selectedValue
        const isDisabled = disabled || option.disabled

        return (
          <label
            key={option.value}
            className={[
              'flex min-w-px flex-1 items-center justify-center overflow-clip px-ds-24 py-ds-8',
              'font-sans tracking-[var(--letter-spacing-normal)] whitespace-nowrap',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-border-focused',
              isSelected
                ? 'rounded-ds-small bg-action-primary text-label2-semibold text-text-neutral-inverse'
                : 'rounded-ds-medium bg-background-neutral-default text-label2-medium text-text-neutral-muted',
              isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            ].join(' ')}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => select(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}
