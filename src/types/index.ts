export type Subject = 'READING' | 'MATH' | 'THINKING_SKILLS' | 'VOCAB'

export type TaskExternalLinkType =
  | 'SPELLING_BEE_OC_BROWSE'
  | 'SPELLING_BEE_OC_QUIZ'
  | 'COACHING_PORTAL'
  | 'NONE'

export type DayMode = 'TERM' | 'HOLIDAY'

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface TaskTemplate {
  id: string
  title: string
  subject: Subject
  durationMinutes: number
  externalLinkType: TaskExternalLinkType
  description: string
}

export interface ReadingErrorBreakdown {
  long_passage: number
  poetry: number
  cloze_gap_fill: number
  multi_extract: number
}

export interface QuizScoreLog {
  id: string
  subject: 'READING' | 'MATH' | 'THINKING_SKILLS'
  testName: string
  firstAttemptScore: number
  blindRetryScore?: number
  totalQuestions: number
  readingBreakdown?: ReadingErrorBreakdown
}

export interface DailyCheckIn {
  date: string
  dayMode: DayMode
  plannedMinutes: number
  actualMinutes: number
  completedTaskIds: string[]
  quizLogs: QuizScoreLog[]
  vocabSyncedToSpellingBee: boolean
  notes?: string
}

export interface AppSettings {
  spellingBeeBaseUrl: string
  coachingPortalUrl: string
  githubToken?: string
  githubRepo?: string
  holidayOverrides?: HolidayRange[]
}

export type CheckInMap = Record<string, DailyCheckIn>

export interface PlannerData {
  checkins: CheckInMap
  settings: AppSettings
}

export interface BurnUpPoint {
  date: string
  plannedMinutes: number
  actualMinutes: number
}

export interface HolidayRange {
  name: string
  startDate: string
  endDate: string
}
