import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Icon({ children, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  )
}

export function SidebarToggleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect height="16" rx="4" width="17" x="3.5" y="4" />
      <path d="M13 4v16" />
    </Icon>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m3 10 9-7 9 7v10h-6v-6H9v6H3Z" />
    </Icon>
  )
}

export function PenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 5 5 14l-1 6 6-1 9-9M13 6l5 5M16 3l5 5" />
    </Icon>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5h16v15H4zM8 3v4m8-4v4M4 9h16" />
    </Icon>
  )
}

export function StudentIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM18 8v6m3-3h-6" />
    </Icon>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </Icon>
  )
}
