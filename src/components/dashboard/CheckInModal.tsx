import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Minus, Plus, X } from 'lucide-react'
import { createEmptyCheckIn, getTaskUrl } from '../../utils/scheduleEngine'
import type {
  AppSettings,
  DailyCheckIn,
  HolidayRange,
  ReadingErrorBreakdown,
  TaskTemplate,
} from '../../types'

interface CheckInModalProps {
  date: string
  checkin?: DailyCheckIn
  tasks: TaskTemplate[]
  settings: AppSettings
  holidayOverrides?: HolidayRange[]
  onSave: (checkin: DailyCheckIn) => void
  onClose: () => void
}

type QuizSubject = 'READING' | 'MATH' | 'THINKING_SKILLS'

const SUBJECT_OPTIONS: { value: QuizSubject; label: string }[] = [
  { value: 'READING', label: 'Reading' },
  { value: 'MATH', label: 'Math' },
  { value: 'THINKING_SKILLS', label: 'Thinking Skills' },
]

const ERROR_SECTIONS: { key: keyof ReadingErrorBreakdown; label: string }[] = [
  { key: 'long_passage', label: 'Long passage' },
  { key: 'poetry', label: 'Poetry' },
  { key: 'cloze_gap_fill', label: 'Cloze gap-fill' },
  { key: 'multi_extract', label: 'Multi-extract matching' },
]

const emptyBreakdown = (): ReadingErrorBreakdown => ({
  long_passage: 0,
  poetry: 0,
  cloze_gap_fill: 0,
  multi_extract: 0,
})

export default function CheckInModal({
  date,
  checkin,
  tasks,
  settings,
  holidayOverrides = [],
  onSave,
  onClose,
}: CheckInModalProps) {
  const [actualMinutes, setActualMinutes] = useState(checkin?.actualMinutes ?? 0)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(
    checkin?.completedTaskIds ?? [],
  )
  const [quizLogs, setQuizLogs] = useState(checkin?.quizLogs ?? [])
  const [vocabSynced, setVocabSynced] = useState(
    checkin?.vocabSyncedToSpellingBee ?? false,
  )
  const [subject, setSubject] = useState<QuizSubject>('READING')
  const [testName, setTestName] = useState('')
  const [totalQuestions, setTotalQuestions] = useState(20)
  const [firstAttemptScore, setFirstAttemptScore] = useState(0)
  const [blindRetryScore, setBlindRetryScore] = useState(0)
  const [readingBreakdown, setReadingBreakdown] = useState(emptyBreakdown)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const updateErrorCount = (key: keyof ReadingErrorBreakdown, amount: number) => {
    setReadingBreakdown((current) => ({
      ...current,
      [key]: Math.max(0, current[key] + amount),
    }))
  }

  const addQuizLog = () => {
    const cleanName = testName.trim()
    if (!cleanName) {
      setFormError('Enter a test name.')
      return
    }
    if (totalQuestions < 1 || firstAttemptScore > totalQuestions) {
      setFormError('Check the total question count and first-attempt score.')
      return
    }
    if (subject === 'READING' && blindRetryScore > totalQuestions) {
      setFormError('The blind-retry score cannot exceed the total number of questions.')
      return
    }

    setQuizLogs((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        subject,
        testName: cleanName,
        firstAttemptScore,
        totalQuestions,
        ...(subject === 'READING'
          ? { blindRetryScore, readingBreakdown: { ...readingBreakdown } }
          : {}),
      },
    ])
    setTestName('')
    setFirstAttemptScore(0)
    setBlindRetryScore(0)
    setReadingBreakdown(emptyBreakdown())
    setFormError('')
  }

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const base = checkin ?? createEmptyCheckIn(date, holidayOverrides)
    onSave({
      ...base,
      date,
      actualMinutes,
      plannedMinutes: tasks.reduce((total, task) => total + task.durationMinutes, 0),
      completedTaskIds,
      quizLogs,
      vocabSyncedToSpellingBee: vocabSynced,
    })
  }

  const readingBrowseTask: TaskTemplate = {
    id: 'checkin-spellingbee-browse',
    title: 'Open SpellingBee',
    subject: 'VOCAB',
    durationMinutes: 0,
    externalLinkType: 'SPELLING_BEE_OC_BROWSE',
    description: '',
  }
  const spellingBeeUrl = getTaskUrl(readingBrowseTask, settings)

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <section
        className="checkin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">DAILY CHECK-IN</p>
            <h2 id="checkin-title">Study Check-in</h2>
            <p className="modal-date">
              {new Intl.DateTimeFormat('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }).format(new Date(`${date}T00:00:00`))}
            </p>
          </div>
          <button type="button" className="icon-button close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save}>
          <div className="modal-content">
            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>Study session</h3>
                  <p>Mark completed tasks and record your actual study time.</p>
                </div>
                <label className="minutes-input">
                  <span>Actual time</span>
                  <span className="number-with-unit">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={actualMinutes}
                      onChange={(event) => setActualMinutes(Math.max(0, Number(event.target.value)))}
                    />
                    <span>min</span>
                  </span>
                </label>
              </div>
              <div className="checkin-task-list">
                {tasks.map((task) => (
                  <label className="checkin-task" key={task.id}>
                    <input
                      type="checkbox"
                      checked={completedTaskIds.includes(task.id)}
                      onChange={() =>
                        setCompletedTaskIds((current) =>
                          current.includes(task.id)
                            ? current.filter((id) => id !== task.id)
                            : [...current, task.id],
                        )
                      }
                    />
                    <span className="custom-check"><Check size={13} /></span>
                    <span>{task.title}</span>
                    <small>{task.durationMinutes} min</small>
                  </label>
                ))}
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>Test results</h3>
                  <p>Record the first attempt; add the blind retry and error breakdown for Reading.</p>
                </div>
              </div>
              {quizLogs.length > 0 && (
                <div className="saved-quiz-list">
                  {quizLogs.map((log) => (
                    <div className="saved-quiz" key={log.id}>
                      <span>
                        <strong>{log.testName}</strong>
                        <small>{SUBJECT_OPTIONS.find((option) => option.value === log.subject)?.label} · First attempt {log.firstAttemptScore}/{log.totalQuestions}
                          {log.blindRetryScore !== undefined && ` · Blind retry ${log.blindRetryScore}/${log.totalQuestions}`}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="text-button danger-text"
                        onClick={() => setQuizLogs((current) => current.filter((item) => item.id !== log.id))}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="quiz-entry">
                <label className="field-label">
                  Subject
                  <select
                    value={subject}
                    onChange={(event) => setSubject(event.target.value as QuizSubject)}
                  >
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  Test name
                  <input
                    type="text"
                    placeholder="e.g. W3 Reading Test 1"
                    value={testName}
                    onChange={(event) => setTestName(event.target.value)}
                  />
                </label>
                <div className="score-row">
                  <label className="field-label">
                    First-attempt score
                    <input
                      type="number"
                      min="0"
                      max={totalQuestions}
                      value={firstAttemptScore}
                      onChange={(event) => setFirstAttemptScore(Math.max(0, Number(event.target.value)))}
                    />
                  </label>
                  <label className="field-label">
                    Total questions
                    <input
                      type="number"
                      min="1"
                      value={totalQuestions}
                      onChange={(event) => setTotalQuestions(Math.max(1, Number(event.target.value)))}
                    />
                  </label>
                  {subject === 'READING' && (
                    <label className="field-label">
                      Blind-retry score
                      <input
                        type="number"
                        min="0"
                        max={totalQuestions}
                        value={blindRetryScore}
                        onChange={(event) => setBlindRetryScore(Math.max(0, Number(event.target.value)))}
                      />
                    </label>
                  )}
                </div>

                {subject === 'READING' && (
                  <div className="reading-review">
                    <div className="review-heading">
                      <div>
                        <h4>Errors by question type</h4>
                        <p>Record each first-attempt error by section.</p>
                      </div>
                    </div>
                    <div className="error-counter-grid">
                      {ERROR_SECTIONS.map(({ key, label }) => (
                        <div className="error-counter" key={key}>
                          <span>{label}</span>
                          <div>
                            <button
                              type="button"
                              className="stepper-button"
                              onClick={() => updateErrorCount(key, -1)}
                              aria-label={`Decrease ${label} errors`}
                            >
                              <Minus size={13} />
                            </button>
                            <output>{readingBreakdown[key]}</output>
                            <button
                              type="button"
                              className="stepper-button"
                              onClick={() => updateErrorCount(key, 1)}
                              aria-label={`Increase ${label} errors`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <label className="vocab-confirm">
                      <input
                        type="checkbox"
                        checked={vocabSynced}
                        onChange={(event) => setVocabSynced(event.target.checked)}
                      />
                      <span className="custom-check"><Check size={13} /></span>
                      <span>I added today’s unfamiliar Reading words to SpellingBee (OC mode).</span>
                    </label>
                    {spellingBeeUrl ? (
                      <a className="secondary-link" href={spellingBeeUrl} target="_blank" rel="noopener noreferrer">
                        Open SpellingBee <Plus size={14} />
                      </a>
                    ) : (
                      <span className="helper-text">Configure the SpellingBee URL in Settings first.</span>
                    )}
                  </div>
                )}
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button type="button" className="secondary-button add-quiz-button" onClick={addQuizLog}>
                  Add test result
                </button>
              </div>
            </section>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button">Save check-in <Check size={16} /></button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}
