import type { AuthUser } from '../../../types/auth'

const roleLabels: Record<string, string> = {
  DIRECTOR: '원장님',
  TEACHER: '선생님',
}

export default function HomeWelcome({ user }: { user: AuthUser }) {
  const displayName = [user.name, roleLabels[user.role]].filter(Boolean).join(' ')

  return (
    <div className="flex flex-col gap-ds-16">
      <h1 className="text-h1 text-text-neutral-default">어서오세요, {displayName}</h1>
      <p className="text-h3 text-text-neutral-muted">어서 오세요, {displayName}</p>
    </div>
  )
}
