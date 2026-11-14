import { useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef } from 'react'

const options = ['Standard', 'Advanced'] as const

export type SegmentedControlValue = typeof options[number]

export type SegmentedControlProps = Omit<
  ComponentPropsWithRef<'fieldset'>,
  'children' | 'onChange' | 'defaultValue'
> & {
  label?: string
  value?: SegmentedControlValue
  defaultValue?: SegmentedControlValue
  onValueChange?: (value: SegmentedControlValue) => void
}

export default function SegmentedControl({
  label = '첨삭 모드',
  value,
  defaultValue = 'Standard',
  onValueChange,
  name,
  form,
  ref,
  disabled = false,
  className = '',
  ...props
}: SegmentedControlProps) {
  const generatedName = useId()
  const fieldsetRef = useRef<HTMLFieldSetElement>(null)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue

  useImperativeHandle(ref, () => fieldsetRef.current!)

  useEffect(() => {
    if (value !== undefined) return
    const ownerForm = fieldsetRef.current?.form
    function handleReset(event: Event) {
      queueMicrotask(() => {
        if (!event.defaultPrevented) setInternalValue(defaultValue)
      })
    }
    ownerForm?.addEventListener('reset', handleReset)
    return () => ownerForm?.removeEventListener('reset', handleReset)
  }, [defaultValue, value, form])

  function selectValue(nextValue: SegmentedControlValue) {
    if (disabled || nextValue === currentValue) return
    if (value === undefined) setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <fieldset
      {...props}
      ref={fieldsetRef}
      form={form}
      disabled={disabled}
      className={`flex w-[240px] max-w-full min-w-0 items-center gap-ds-4 rounded-ds-medium border border-solid border-border-default bg-background-neutral-default p-ds-4 font-sans ${className}`}
    >
      <legend className="sr-only">{label}</legend>
      {options.map(option => {
        const selected = option === currentValue
        return (
          <label key={option} className="relative min-w-0 flex-1">
            <input
              type="radio"
              name={name ?? generatedName}
              form={form}
              value={option}
              checked={selected}
              disabled={disabled}
              className="peer sr-only"
              onChange={() => selectValue(option)}
            />
            <span
              lang="en"
              className={[
                'flex items-center justify-center overflow-hidden px-ds-24 py-ds-8 whitespace-nowrap tracking-normal',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-border-focused',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                selected
                  ? `rounded-ds-small text-label2-semibold ${disabled ? 'bg-action-disabled text-text-neutral-subtle' : 'bg-action-primary text-text-neutral-inverse'}`
                  : 'rounded-ds-medium bg-background-neutral-default text-label2-medium text-text-neutral-subtle',
              ].join(' ')}
            >
              {option}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
