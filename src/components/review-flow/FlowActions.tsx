import type { ReactNode } from 'react'

export function FlowActions({ children }: { children: ReactNode }) {
  return <div className="col-span-full mt-0.5 flex justify-end gap-2 max-sm:mt-3">{children}</div>
}
