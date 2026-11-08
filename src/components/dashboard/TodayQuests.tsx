import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Clock3, ExternalLink, RotateCcw } from 'lucide-react'
import { getTaskUrl } from '../../utils/scheduleEngine'
import type { AppSettings, TaskTemplate } from '../../types'

interface TodayQuestsProps {
  date: string
  tasks: TaskTemplate[]
  completedTaskIds: string[]
  settings: AppSettings
  onToggleTask: (taskId: string) => void
  onOpenCheckIn: () => void
}

const SUBJECT_LABELS: Record<TaskTemplate['subject'], string> = {
  READING: 'Reading',
  MATH: 'Math',
  THINKING_SKILLS: 'Thinking',
  VOCAB: 'Vocabulary',
}

function TaskCard({
  task,
  checked,
  settings,
  onToggle,
}: {
  task: TaskTemplate
  checked: boolean
  settings: AppSettings
  onToggle: () => void
}) {
  const [secondsRemaining, setSecondsRemaining] = useState(task.durationMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const link = getTaskUrl(task, settings)

  useEffect(() => {
    if (!isRunning || secondsRemaining === 0) {
      return
    }
    const timerId = window.setTimeout(() => {
      if (secondsRemaining === 1) {
        setSecondsRemaining(0)
        setIsRunning(false)
      } else {
        setSecondsRemaining(secondsRemaining - 1)
      }
    }, 1000)
    return () => window.clearTimeout(timerId)
  }, [isRunning, secondsRemaining])

  const minutes = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (secondsRemaining % 60).toString().padStart(2, '0')

  return (
    <article className={`quest-card${checked ? ' completed' : ''}`}>
      <label className="quest-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Mark complete: ${task.title}`}
        />
        <span className="custom-check"><Check size={14} /></span>
      </label>

      <div className="quest-copy">
        <div className="quest-meta">
          <span className={`subject-badge ${task.subject.toLowerCase()}`}>
            {SUBJECT_LABELS[task.subject]}
          </span>
          <span className="duration-label"><Clock3 size={13} /> {task.durationMinutes} min</span>
        </div>
        <h3>{task.title}</h3>
        <p>{task.description}</p>
      </div>

      <div className="quest-actions">
        <div className="timer-control">
          <span className="timer-display" aria-live="polite">{minutes}:{seconds}</span>
          <div className="timer-buttons">
            <button
              type="button"
              className="timer-button"
              onClick={() => {
                if (secondsRemaining === 0) {
                  setSecondsRemaining(task.durationMinutes * 60)
                  setIsRunning(true)
                } else {
                  setIsRunning((running) => !running)
                }
              }}
              aria-label={secondsRemaining === 0 ? `Restart timer for ${task.title}` : isRunning ? 'Pause timer' : 'Start timer'}
            >
              {secondsRemaining === 0 ? 'Restart' : isRunning ? 'Pause' : 'Start'}
            </button>
            <button
              type="button"
              className="timer-reset"
              onClick={() => {
                setIsRunning(false)
                setSecondsRemaining(task.durationMinutes * 60)
              }}
              aria-label={`Reset timer for ${task.title}`}
              title="Reset timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
        {task.externalLinkType !== 'NONE' && (
          link ? (
            <a className="quest-link" href={link} target="_blank" rel="noopener noreferrer">
              Practice <ArrowUpRight size={15} />
            </a>
          ) : (
            <span className="quest-link disabled" title="Configure this website URL in Settings first">
              Not configured <ExternalLink size={14} />
            </span>
          )
        )}
      </div>
    </article>
  )
}

export default function TodayQuests({
  date,
  tasks,
  completedTaskIds,
  settings,
  onToggleTask,
  onOpenCheckIn,
}: TodayQuestsProps) {
  const completedCount = tasks.filter((task) => completedTaskIds.includes(task.id)).length
  const dateLabel = new Intl.DateTimeFormat('en-AU', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(`${date}T00:00:00`))

  return (
    <section className="quests-panel panel">
      <div className="section-heading quest-heading">
        <div>
          <p className="eyebrow">TODAY’S QUESTS · {dateLabel}</p>
          <h2>Today’s Quests</h2>
        </div>
        <div className="quest-progress">
          <span>{completedCount} / {tasks.length} complete</span>
          <div className="progress-track" aria-label={`${completedCount} of ${tasks.length} tasks complete`}>
            <span style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="quest-list">
          {tasks.map((task) => (
            <TaskCard
              key={`${date}-${task.id}`}
              task={task}
              checked={completedTaskIds.includes(task.id)}
              settings={settings}
              onToggle={() => onToggleTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">No tasks are scheduled for this day. Enjoy the break!</p>
      )}

      <button type="button" className="primary-button checkin-open" onClick={onOpenCheckIn}>
        Log study session <ArrowUpRight size={17} />
      </button>
    </section>
  )
}
