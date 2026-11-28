import { useId } from 'react'
import searchDefault from '../../assets/design-system/search-default.svg'
import searchActive from '../../assets/design-system/search-active.svg'

export type SearchBarProps = {
  value: string
  onValueChange: (value: string) => void
  onSearch: () => void
  label?: string
  placeholder?: string
  className?: string
}

export default function SearchBar({
  value,
  onValueChange,
  onSearch,
  label = '검색',
  placeholder = '검색어를 입력해주세요.',
  className = '',
}: SearchBarProps) {
  const id = useId()

  return (
    <form
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
      className={`flex h-ds-40 w-[400px] max-w-full items-center gap-ds-8 rounded-ds-small border border-solid bg-background-neutral-default px-ds-12 focus-within:border-border-neutral-disabled ${value ? 'border-border-neutral-disabled' : 'border-border-neutral-default'} ${className}`}
    >
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
        }}
        className="min-w-0 flex-1 appearance-none bg-transparent font-sans text-label2-semibold text-text-neutral-default caret-text-brand-strong outline-none placeholder:text-text-neutral-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label="검색 실행"
        className="flex size-ds-16 shrink-0 cursor-pointer items-center justify-center rounded-ds-small focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-brand-focus"
      >
        <img src={value ? searchActive : searchDefault} alt="" />
      </button>
    </form>
  )
}
