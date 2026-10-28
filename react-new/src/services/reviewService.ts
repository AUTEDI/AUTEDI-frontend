import { initialFeedback } from '../features/review/mockData'
import type { FeedbackItem, ReviewSetting } from '../features/review/types'

export type ReviewResult = {
  feedback: FeedbackItem[]
}

export async function generateReview(settings: ReviewSetting[]): Promise<ReviewResult> {
  if (!settings.some((setting) => setting.selected)) {
    throw new Error('At least one feedback category must be selected.')
  }
  await new Promise((resolve) => window.setTimeout(resolve, 2400))
  return {
    feedback: initialFeedback.map((item) => ({ ...item })),
  }
}
