import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Minus, Plus, X } from 'lucide-react'
import { createEmptyCheckIn, getTaskUrl } from '../../utils/scheduleEngine'
import type {
  AppSettings,
  DailyCheckIn,
  ReadingErrorBreakdown,
  TaskTemplate,
} from '../../types'

interface CheckInModalProps {
  date: string
  checkin?: DailyCheckIn
  tasks: TaskTemplate[]
  settings: AppSettings
  onSave: (checkin: DailyCheckIn) => void
  onClose: () => void
}

type QuizSubject = 'READING' | 'MATH' | 'THINKING_SKILLS'

const SUBJECT_OPTIONS: { value: QuizSubject; label: string }[] = [
  { value: 'READING', label: '阅读' },
  { value: 'MATH', label: '数学' },
  { value: 'THINKING_SKILLS', label: '思维' },
]

const ERROR_SECTIONS: { key: keyof ReadingErrorBreakdown; label: string }[] = [
  { key: 'long_passage', label: '长篇文章' },
  { key: 'poetry', label: '诗歌理解' },
  { key: 'cloze_gap_fill', label: '完形填空' },
  { key: 'multi_extract', label: '多文本匹配' },
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
      setFormError('请填写测验名称。')
      return
    }
    if (totalQuestions < 1 || firstAttemptScore > totalQuestions) {
      setFormError('请检查题目总数和一刷得分。')
      return
    }
    if (subject === 'READING' && blindRetryScore > totalQuestions) {
      setFormError('二刷盲改得分不能高于题目总数。')
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
    const base = checkin ?? createEmptyCheckIn(date)
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
    title: '打开 SpellingBee',
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
            <h2 id="checkin-title">学习打卡</h2>
            <p className="modal-date">
              {new Intl.DateTimeFormat('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              }).format(new Date(`${date}T00:00:00`))}
            </p>
          </div>
          <button type="button" className="icon-button close-modal" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={save}>
          <div className="modal-content">
            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>今日学习</h3>
                  <p>勾选完成任务，并记录实际学习时长。</p>
                </div>
                <label className="minutes-input">
                  <span>实际时长</span>
                  <span className="number-with-unit">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={actualMinutes}
                      onChange={(event) => setActualMinutes(Math.max(0, Number(event.target.value)))}
                    />
                    <span>分钟</span>
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
                    <small>{task.durationMinutes} 分钟</small>
                  </label>
                ))}
              </div>
            </section>

            <section className="form-section">
              <div className="form-section-heading">
                <div>
                  <h3>测验记录</h3>
                  <p>保存一刷成绩；阅读测验再记录盲改和错题类型。</p>
                </div>
              </div>
              {quizLogs.length > 0 && (
                <div className="saved-quiz-list">
                  {quizLogs.map((log) => (
                    <div className="saved-quiz" key={log.id}>
                      <span>
                        <strong>{log.testName}</strong>
                        <small>{SUBJECT_OPTIONS.find((option) => option.value === log.subject)?.label} · 一刷 {log.firstAttemptScore}/{log.totalQuestions}
                          {log.blindRetryScore !== undefined && ` · 盲改 ${log.blindRetryScore}/${log.totalQuestions}`}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="text-button danger-text"
                        onClick={() => setQuizLogs((current) => current.filter((item) => item.id !== log.id))}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="quiz-entry">
                <label className="field-label">
                  科目
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
                  测验名称
                  <input
                    type="text"
                    placeholder="例如：W3 Reading Test 1"
                    value={testName}
                    onChange={(event) => setTestName(event.target.value)}
                  />
                </label>
                <div className="score-row">
                  <label className="field-label">
                    一刷得分
                    <input
                      type="number"
                      min="0"
                      max={totalQuestions}
                      value={firstAttemptScore}
                      onChange={(event) => setFirstAttemptScore(Math.max(0, Number(event.target.value)))}
                    />
                  </label>
                  <label className="field-label">
                    题目总数
                    <input
                      type="number"
                      min="1"
                      value={totalQuestions}
                      onChange={(event) => setTotalQuestions(Math.max(1, Number(event.target.value)))}
                    />
                  </label>
                  {subject === 'READING' && (
                    <label className="field-label">
                      二刷盲改得分
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
                        <h4>四大题型错题数</h4>
                        <p>按一刷错题所属题型记录</p>
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
                              aria-label={`${label}错题数减一`}
                            >
                              <Minus size={13} />
                            </button>
                            <output>{readingBreakdown[key]}</output>
                            <button
                              type="button"
                              className="stepper-button"
                              onClick={() => updateErrorCount(key, 1)}
                              aria-label={`${label}错题数加一`}
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
                      <span>已将今日阅读生词录入 SpellingBee（OC 模式）</span>
                    </label>
                    {spellingBeeUrl ? (
                      <a className="secondary-link" href={spellingBeeUrl} target="_blank" rel="noopener noreferrer">
                        打开 SpellingBee <Plus size={14} />
                      </a>
                    ) : (
                      <span className="helper-text">请先配置 SpellingBee 地址。</span>
                    )}
                  </div>
                )}
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <button type="button" className="secondary-button add-quiz-button" onClick={addQuizLog}>
                  添加这条测验记录
                </button>
              </div>
            </section>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>取消</button>
            <button type="submit" className="primary-button">保存打卡 <Check size={16} /></button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  )
}
