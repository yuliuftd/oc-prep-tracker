import type {
  HolidayRange,
  TaskTemplate,
  Weekday,
} from '../types'

export const PLAN_START_DATE = '2026-11-09'
export const EXAM_DATE = '2027-05-11'

export const NSW_SCHOOL_HOLIDAYS: HolidayRange[] = [
  {
    name: 'Summer Holiday',
    startDate: '2026-12-18',
    endDate: '2027-01-31',
  },
  {
    name: 'Autumn Holiday',
    startDate: '2027-04-10',
    endDate: '2027-04-25',
  },
]

const task = (
  id: string,
  title: string,
  subject: TaskTemplate['subject'],
  durationMinutes: number,
  externalLinkType: TaskTemplate['externalLinkType'],
  description: string,
): TaskTemplate => ({
  id,
  title,
  subject,
  durationMinutes,
  externalLinkType,
  description,
})

export const TERM_WEEKLY_TEMPLATE: Record<Weekday, TaskTemplate[]> = {
  0: [
    task('term-sun-reading-mock', 'Full Timed Reading Mock (MacBook)', 'READING', 40, 'COACHING_PORTAL', 'Complete a full timed reading mock.'),
    task('term-sun-blind-retry', 'Reading Blind Retry + Error Categorization + Sync New Words to SpellingBee', 'READING', 30, 'SPELLING_BEE_OC_BROWSE', 'Retry missed questions without explanations, categorize errors, and add unfamiliar words to SpellingBee.'),
  ],
  1: [
    task('term-mon-reading', 'Reading Targeted Practice', 'READING', 25, 'COACHING_PORTAL', 'Work on the current reading skill target.'),
    task('term-mon-vocab', 'OC Vocab 10-Word Quiz', 'VOCAB', 15, 'SPELLING_BEE_OC_QUIZ', 'Quiz yourself on ten OC vocabulary words.'),
  ],
  2: [
    task('term-tue-math', 'Math Timed Drill', 'MATH', 20, 'COACHING_PORTAL', 'Complete a timed mathematics drill.'),
    task('term-tue-reading-review', 'Reading Error Passage Re-read & Vocab Review', 'READING', 15, 'SPELLING_BEE_OC_BROWSE', 'Re-read a previously missed passage and review its unfamiliar vocabulary.'),
  ],
  3: [
    task('term-wed-reading', 'Reading Poetry / Cloze Practice', 'READING', 25, 'COACHING_PORTAL', 'Practice poetry comprehension or cloze questions.'),
    task('term-wed-thinking', 'Thinking Skills Timed Drill', 'THINKING_SKILLS', 15, 'COACHING_PORTAL', 'Complete a timed thinking skills drill.'),
  ],
  4: [
    task('term-thu-vocab', '[Streak Saver] iPad OC Vocab Quick Quiz', 'VOCAB', 10, 'SPELLING_BEE_OC_QUIZ', 'A short vocabulary quiz for the busy Thursday evening.'),
  ],
  5: [
    task('term-fri-thinking', 'Thinking Skills Practice Set', 'THINKING_SKILLS', 20, 'COACHING_PORTAL', 'Complete a thinking skills practice set.'),
    task('term-fri-vocab', 'OC Vocab Unfamiliar Words Clear-out', 'VOCAB', 15, 'SPELLING_BEE_OC_BROWSE', 'Review and clear unfamiliar words from the current list.'),
  ],
  6: [
    task('term-sat-vocab', '[Class Day] Log 5 New Coaching Words into SpellingBee', 'VOCAB', 10, 'SPELLING_BEE_OC_BROWSE', 'Add five new words from the coaching class to SpellingBee.'),
  ],
}

export const HOLIDAY_READING_TASK = task(
  'holiday-reading',
  'Full Reading Practice + Blind Retry',
  'READING',
  45,
  'COACHING_PORTAL',
  'Complete reading practice and retry missed questions without viewing explanations.',
)

export const HOLIDAY_VOCAB_TASK = task(
  'holiday-vocab',
  'OC Vocab Quiz on SpellingBee',
  'VOCAB',
  10,
  'SPELLING_BEE_OC_QUIZ',
  'Practice OC vocabulary in SpellingBee.',
)

export const HOLIDAY_ROTATION_TASKS: [TaskTemplate, TaskTemplate] = [
  task('holiday-math', 'Math Practice', 'MATH', 20, 'COACHING_PORTAL', 'Complete the holiday mathematics practice rotation.'),
  task('holiday-thinking', 'Thinking Skills Practice', 'THINKING_SKILLS', 20, 'COACHING_PORTAL', 'Complete the holiday thinking skills practice rotation.'),
]

export const HOLIDAY_SATURDAY_TEMPLATE: TaskTemplate[] = [
  task('holiday-sat-vocab', 'Light Vocab Review after Coaching Class', 'VOCAB', 15, 'SPELLING_BEE_OC_BROWSE', 'Review vocabulary lightly after the coaching class.'),
]

export const HOLIDAY_WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5]
