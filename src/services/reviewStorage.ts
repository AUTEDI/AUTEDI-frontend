import type { FeedbackItem, ReviewSetting, TeacherComment } from '../features/review/types'

export type SavedReview = {
  id: string; savedAt: string; imageUrl: string; imageName: string
  feedback: FeedbackItem[]; teacherComments: TeacherComment[]
  appliedFeedbackIds: string[]; sessionSettings: ReviewSetting[]
}
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('autedi-reviews', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('reviews', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
export async function saveReview(review: SavedReview) {
  const response = await fetch(review.imageUrl)
  if (!response.ok) throw new Error('Image unavailable')
  const blob = await response.blob()
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('reviews', 'readwrite')
      tx.objectStore('reviews').put({ ...review, imageUrl })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally { db.close() }
}
export async function listReviews(): Promise<SavedReview[]> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('reviews').objectStore('reviews').getAll()
      request.onsuccess = () => resolve((request.result as SavedReview[]).sort((a,b) => b.savedAt.localeCompare(a.savedAt)))
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}
