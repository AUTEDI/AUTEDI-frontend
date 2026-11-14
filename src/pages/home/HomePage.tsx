import { mockCorrections } from '../../mocks/corrections'
import { mockUser } from '../../mocks/user'
import HomeWelcome from './components/HomeWelcome'
import RecentCorrections from './components/RecentCorrections'
import StartCorrectionCard from './components/StartCorrectionCard'

export default function HomePage() {
  return (
    <div className="flex w-full min-w-0 flex-col gap-ds-40 py-ds-40 pr-[120px] pl-ds-48">
      <div className="flex flex-col gap-ds-24">
        <HomeWelcome user={mockUser} />
        <StartCorrectionCard />
      </div>
      <RecentCorrections items={mockCorrections} />
    </div>
  )
}
