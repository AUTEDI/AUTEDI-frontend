import { mockCorrections } from '../../mocks/corrections'
import { mockUser } from '../../mocks/user'
import HomeWelcome from './components/HomeWelcome'
import RecentCorrections from './components/RecentCorrections'
import StartCorrectionCard from './components/StartCorrectionCard'

export default function HomePage() {
  return (
    <div className="flex w-full max-w-[1120px] flex-col gap-ds-40 px-ds-48 py-ds-40">
      <div className="flex flex-col gap-ds-24">
        <HomeWelcome user={mockUser} />
        <StartCorrectionCard />
      </div>
      <RecentCorrections items={mockCorrections} />
    </div>
  )
}
