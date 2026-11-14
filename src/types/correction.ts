export type CorrectionStatus = 'draft' | 'completed'

export type CorrectionPerson = {
  id: string
  name: string
}

export type Correction = {
  id: string
  title: string
  status: CorrectionStatus
  student: CorrectionPerson
  teacher: CorrectionPerson
  createdAt: string
}
