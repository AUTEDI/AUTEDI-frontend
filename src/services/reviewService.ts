import { initialFeedback } from '../features/review/mockData'
import type { FeedbackItem, ReviewSetting } from '../features/review/types'

export type ReviewResult = {
  feedback: FeedbackItem[]
}

export async function generateReview(settings: ReviewSetting[], isSample = true): Promise<ReviewResult> {
  if (!settings.some((setting) => setting.selected)) {
    throw new Error('At least one feedback category must be selected.')
  }
  await new Promise((resolve) => window.setTimeout(resolve, 2400))
  return {
    feedback: isSample ? initialFeedback.filter(item => settings.some(s => s.selected && s.en === item.category)).map((item) => {
      const setting = settings.find(s => s.en === item.category)!
      return { ...item, suggestion: setting.level === 'Advanced' ? ({
          '1': 'Have you ever read the Harry Potter series?',
          '2': 'I love this book for several reasons.',
          '3': 'a magical car that can fly and become invisible',
          '4': 'Develop your point about friendship with a scene showing how the three friends support each other.',
        }[item.id] ?? item.suggestion) : ({
          '2': 'There are several reasons why I love this book.',
          '4': 'Add one example of their friendship.',
        }[item.id] ?? item.suggestion),
        reason: `${item.reason} (${setting.level === 'Advanced' ? '적극적인 표현 개선' : '원문을 존중하는 기본 첨삭'})` }
    }) : [],
  }
}
