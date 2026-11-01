import { useEffect, useState } from 'react'
import { useAppStore } from '../../stores/useAppStore'
import { cn } from '../../utils/cn'

const TOAST_DURATION_MS = 3000
const TOAST_WITH_ACTION_MS = 5000

export function Toast() {
  const toast = useAppStore((state) => state.toast)
  const hideToast = useAppStore((state) => state.hideToast)
  // 사라지는 동안에도 마지막 문구를 보여주기 위해 따로 보관한다.
  const [shown, setShown] = useState(toast)

  if (toast && toast !== shown) setShown(toast)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(hideToast, toast.action ? TOAST_WITH_ACTION_MS : TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [hideToast, toast])

  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed bottom-[25px] left-1/2 z-60 flex -translate-x-1/2 items-center gap-[17px] rounded-[10px] bg-[#171b34] px-[14px] py-[11px] text-[8px] text-white shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition duration-300',
        toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[100px] opacity-0',
      )}
      role="status"
    >
      <span>{shown?.message}</span>
      {shown?.action && (
        <button
          className="text-[8px] font-extrabold text-[#abb4ff]"
          onClick={() => {
            shown.action?.onClick()
            hideToast()
          }}
          type="button"
        >
          {shown.action.label}
        </button>
      )}
    </div>
  )
}
