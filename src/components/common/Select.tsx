import { useEffect, useId, useImperativeHandle, useRef, useState, type ComponentPropsWithRef, type KeyboardEvent } from 'react'
import downArrow from '../../assets/design-system/3d6ad.svg'
import upArrow from '../../assets/design-system/efa4e.svg'
import checkIcon from '../../assets/design-system/63428.svg'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type SelectProps = Omit<
  ComponentPropsWithRef<'button'>,
  'children' | 'type' | 'value' | 'defaultValue' | 'onChange' | 'onClick' | 'role' | 'aria-expanded' | 'aria-controls' | 'aria-activedescendant'
> & {
  label: string
  showLabel?: boolean
  options: readonly SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  loadingMessage?: string
  emptyMessage?: string
  error?: string
}

export default function Select({
  label,
  showLabel = false,
  options,
  value,
  defaultValue = '',
  onValueChange,
  placeholder = '학생을 선택해주세요.',
  isLoading = false,
  loadingMessage = '학생 목록을 불러오는 중이에요.',
  emptyMessage = '등록된 학생이 없어요.',
  error,
  id,
  name,
  form,
  ref,
  className = '',
  disabled = false,
  onKeyDown,
  onBlur,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listId = `${triggerId}-listbox`
  const messageId = `${triggerId}-message`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef({ text: '', time: 0 })
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [activeValue, setActiveValue] = useState<string | null>(null)
  const currentValue = value ?? internalValue
  const selectedOption = options.find(option => option.value === currentValue)
  const availableOptions = isLoading || error ? [] : options.filter(option => !option.disabled)
  const activeOption = availableOptions.find(option => option.value === activeValue)
    ?? availableOptions.find(option => option.value === currentValue)
    ?? availableOptions[0]
  const activeIndex = availableOptions.findIndex(option => option === activeOption)
  const isOpen = open && !disabled
  const statusMessage = isLoading ? loadingMessage : error || (options.length === 0 ? emptyMessage : undefined)
  const activeId = isOpen && activeOption ? `${listId}-${options.indexOf(activeOption)}` : undefined

  useImperativeHandle(ref, () => triggerRef.current!)

  useEffect(() => {
    if (!isOpen) return
    function handleOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsideClick)
    return () => document.removeEventListener('pointerdown', handleOutsideClick)
  }, [isOpen])

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  useEffect(() => {
    const ownerForm = triggerRef.current?.form
    function handleReset() {
      if (value === undefined) setInternalValue(defaultValue)
      setOpen(false)
      setActiveValue(null)
    }
    ownerForm?.addEventListener('reset', handleReset)
    return () => ownerForm?.removeEventListener('reset', handleReset)
  }, [defaultValue, value, form])

  function selectOption(option: SelectOption) {
    if (disabled || isLoading || error || option.disabled) return
    if (value === undefined) setInternalValue(option.value)
    if (option.value !== currentValue) onValueChange?.(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function openList(fromEnd = false) {
    setActiveValue(availableOptions.find(option => option.value === currentValue)?.value
      ?? (fromEnd ? availableOptions.at(-1)?.value : availableOptions[0]?.value)
      ?? null)
    searchRef.current = { text: '', time: 0 }
    setOpen(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === 'Tab') { setOpen(false); return }
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!isOpen) openList()
      else if (activeOption) selectOption(activeOption)
      return
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
        openList(event.key === 'ArrowUp')
        return
      }
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? availableOptions.length - 1
          : Math.max(0, Math.min(availableOptions.length - 1, activeIndex + (event.key === 'ArrowDown' ? 1 : -1)))
      setActiveValue(availableOptions[nextIndex]?.value ?? null)
      setOpen(true)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !event.nativeEvent.isComposing) {
      const now = Date.now()
      const search = searchRef.current
      const text = (now - search.time < 500 ? search.text : '') + event.key.toLocaleLowerCase()
      searchRef.current = { text, time: now }
      const match = availableOptions.find(option => option.label.toLocaleLowerCase().startsWith(text))
      if (match) { event.preventDefault(); setActiveValue(match.value); setOpen(true) }
    }
  }

  return (
    <div ref={rootRef} className={`relative flex w-[240px] max-w-full flex-col gap-ds-4 ${className}`}>
      <label htmlFor={triggerId} className={showLabel ? 'text-label2-medium' : 'sr-only'}>{label}</label>
      {name && <input type="hidden" name={name} form={form} value={selectedOption?.value ?? ''} disabled={disabled} />}
      <button
        {...props}
        ref={triggerRef}
        id={triggerId}
        type="button"
        form={form}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeId}
        aria-busy={isLoading || undefined}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={[describedBy, statusMessage ? messageId : undefined].filter(Boolean).join(' ') || undefined}
        className={[
          'flex h-ds-40 w-full items-center justify-between gap-ds-10 rounded-ds-medium border border-solid px-ds-12 py-ds-10 text-left font-sans text-label2-semibold',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused',
          disabled ? 'cursor-not-allowed border-border-disabled bg-background-neutral-disabled text-text-neutral-subtle'
            : `cursor-pointer bg-background-neutral-default ${error ? 'border-border-error' : 'border-border-default'} ${selectedOption && !isLoading ? 'text-text-neutral-default' : 'text-text-neutral-subtle'}`,
        ].join(' ')}
        onClick={() => { if (isOpen) setOpen(false); else openList() }}
        onKeyDown={handleKeyDown}
        onBlur={event => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false)
          onBlur?.(event)
        }}
      >
        <span className="truncate">{isLoading ? loadingMessage : selectedOption?.label ?? placeholder}</span>
        <span aria-hidden="true" className="relative flex h-[5px] w-[10px] shrink-0 items-center justify-center">
          <img src={isOpen ? upArrow : downArrow} alt="" className={isOpen ? 'max-w-none -rotate-90' : 'max-w-none rotate-90 -scale-y-100'} />
        </span>
      </button>
      {isOpen && (
        <div className="absolute inset-x-0 top-full z-10 mt-ds-8 overflow-hidden rounded-ds-medium border border-solid border-border-weak bg-background-neutral-default">
          <ul id={listId} role="listbox" aria-label={label} aria-busy={isLoading || undefined} className="max-h-[218px] overflow-y-auto">
            {!statusMessage && options.map((option, index) => {
              const selected = option.value === currentValue
              const active = option === activeOption
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  className={[
                    'flex min-h-ds-36 items-center justify-between gap-ds-10 px-ds-12 py-ds-10 font-sans text-label3-medium',
                    option.disabled ? 'cursor-not-allowed text-text-neutral-subtle'
                      : `${selected || active ? 'bg-background-brand-weak' : 'bg-background-neutral-default'} cursor-pointer ${selected ? 'text-text-neutral-default' : 'text-text-neutral-muted'}`,
                  ].join(' ')}
                  onPointerMove={() => { if (!option.disabled) setActiveValue(option.value) }}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && <img src={checkIcon} width="10" height="8" alt="" className="shrink-0" />}
                </li>
              )
            })}
          </ul>
          {statusMessage && <p id={messageId} role={error && !isLoading ? 'alert' : 'status'} className="px-ds-12 py-ds-10 text-label3-medium text-text-neutral-muted">{statusMessage}</p>}
        </div>
      )}
      {!isOpen && statusMessage && <p id={messageId} role={error && !isLoading ? 'alert' : 'status'} className={error && !isLoading ? 'text-caption text-text-accent-red' : 'sr-only'}>{statusMessage}</p>}
    </div>
  )
}
