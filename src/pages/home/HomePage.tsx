import { mockCorrections } from '../../mocks/corrections'
import { useAuthStore } from '../../stores/useAuthStore'
import HomeWelcome from './components/HomeWelcome'
import RecentCorrections from './components/RecentCorrections'
import StartCorrectionCard from './components/StartCorrectionCard'

export default function HomePage() {
  const user = useAuthStore(state => state.user)

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col gap-ds-40 bg-background-neutral-default py-ds-40 pr-[calc(120px+var(--spacing-48))] pl-ds-48 max-xl:px-ds-48 max-sm:px-ds-24">
      <div className="flex flex-col gap-ds-24">
        {user && <HomeWelcome user={user} />}
        <StartCorrectionCard />
      </div>
      <RecentCorrections items={mockCorrections} />
    </div>
  )
}
