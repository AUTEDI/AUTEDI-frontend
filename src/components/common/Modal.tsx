import { useEffect, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

type ModalProps = {
  labelledBy: string
  onClose: () => void
  className?: string
  children: ReactNode
}

export function Modal({ labelledBy, onClose, className, children }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(15,18,37,0.52)] backdrop-blur-[5px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={cn('relative max-h-[90vh] overflow-auto rounded-[19px] bg-white p-7 shadow-modal', className)}
        role="dialog"
      >
        <button
          aria-label="닫기"
          className="absolute top-[13px] right-[14px] size-[27px] rounded-full bg-[#f1f2f6] text-[#74798a]"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
