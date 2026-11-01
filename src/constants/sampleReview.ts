import type { AiFeedback } from '../types/review'

export const SAMPLE_WORKSHEET_URL = '/assets/sample-writing.jpeg'
export const SAMPLE_FILE_NAME = 'KakaoTalk_Photo_2026-10-17-15-12-45 001.jpeg'

/**
 * 예시 학습지의 AI 첨삭 결과. 실제 API가 연결되기 전까지 생성 결과로 사용한다.
 * 호출할 때마다 새 객체를 돌려줘서 편집 내용이 다음 첨삭에 남지 않게 한다.
 */
export function createSampleFeedback(): AiFeedback[] {
  return [
    {
      id: '1',
      kind: 'correction',
      category: 'Grammar & Mechanics',
      original: 'have you ever read Harry potter?',
      suggestion: 'Have you ever read Harry Potter?',
      reason: '새 문장은 대문자로 시작하고, 사람 이름과 책 제목 같은 고유명사도 대문자로 써야 합니다.',
      markStyle: 'highlight',
      mark: { left: 28, top: 11.8, width: 29, height: 4.8 },
      noteText: 'Have you ever read\nHarry Potter?',
      notePlacement: { side: 'right', top: 11.5, mobileTop: 8 },
      notePosition: null,
      etag: null,
    },
    {
      id: '2',
      kind: 'improvement',
      category: 'Vocabulary & Expression',
      original: 'There are various reasons why I love this book.',
      suggestion: 'I love this book for several reasons.',
      reason: '같은 뜻을 더 짧고 자연스럽게 전달할 수 있어요. 글의 도입부도 한층 자신감 있게 들립니다.',
      markStyle: 'underline',
      mark: { left: 31, top: 20, width: 53, height: 3.8 },
      noteText: 'I love this book\nfor several reasons.',
      notePlacement: { side: 'left', top: 20, mobileTop: 22 },
      notePosition: null,
      etag: null,
    },
    {
      id: '3',
      kind: 'correction',
      category: 'Sentence Structure',
      original: 'a magical car that also be invisible',
      suggestion: 'a magical car that can also become invisible',
      reason:
        '조동사 can 뒤에는 동사원형이 와야 합니다. become을 사용하면 “보이지 않게 되다”라는 의미도 정확해져요.',
      markStyle: 'highlight',
      mark: { left: 48, top: 56, width: 36, height: 5.2 },
      noteText: 'can also become\ninvisible',
      notePlacement: { side: 'right', top: 56, mobileTop: 55 },
      notePosition: null,
      etag: null,
    },
    {
      id: '4',
      kind: 'improvement',
      category: 'Content & Summary',
      original: 'I really like the friendship they have...',
      suggestion: 'Add one specific example of how Harry, Ron, and Hermione help one another.',
      reason:
        '두 번째 이유에 작품 속 구체적인 장면을 하나 더하면 주장과 근거가 연결되어 글이 더 설득력 있어집니다.',
      markStyle: 'highlight',
      mark: { left: 23, top: 84, width: 67, height: 8.7 },
      noteText: 'Add one specific\nfriendship example.',
      notePlacement: { side: 'left', top: 84, mobileTop: 78 },
      notePosition: null,
      etag: null,
    },
  ]
}
