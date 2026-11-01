import { useState } from 'react'
import { DefaultSettingsCard } from '../components/home/DefaultSettingsCard'
import { DefaultSettingsModal } from '../components/home/DefaultSettingsModal'
import { RecentWork } from '../components/home/RecentWork'
import { StartCard } from '../components/home/StartCard'
import { useAppStore } from '../stores/useAppStore'

export function HomePage() {
  const defaults = useAppStore((state) => state.defaults)
  const navigate = useAppStore((state) => state.navigate)
  const saveDefaults = useAppStore((state) => state.saveDefaults)
  const showToast = useAppStore((state) => state.showToast)
  const [editingDefaults, setEditingDefaults] = useState(false)

  const startReview = () => navigate('ai')

  return (
    <section className="mx-auto max-w-[1450px] animate-fade-page px-[52px] pt-[42px] pb-[50px] max-sm:px-[18px] max-sm:pt-[26px] max-sm:pb-[29px]">
      <div className="grid grid-cols-[1.25fr_0.75fr] gap-[18px] max-md:grid-cols-1">
        <StartCard onStart={startReview} />
        <DefaultSettingsCard onEdit={() => setEditingDefaults(true)} settings={defaults} />
      </div>
      <RecentWork onShowHistory={() => showToast('이력 관리는 곧 열릴 예정이에요')} onStart={startReview} />
      {editingDefaults && (
        <DefaultSettingsModal onClose={() => setEditingDefaults(false)} onSave={saveDefaults} settings={defaults} />
      )}
    </section>
  )
}
