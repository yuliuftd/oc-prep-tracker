import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDayMode, getPlannedMinutesForDate, getTasksForDate } from '../../utils/scheduleEngine'
import type { CheckInMap } from '../../types'

interface WeeklyCalendarProps {
  selectedDate: string
  checkins: CheckInMap
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function WeeklyCalendar({
  selectedDate,
  checkins,
  onSelectDate,
}: WeeklyCalendarProps) {
  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  const moveWeek = (amount: number) => {
    onSelectDate(format(addDays(parseISO(selectedDate), amount * 7), 'yyyy-MM-dd'))
  }

  return (
    <section className="calendar-panel panel" aria-label="每周学习日历">
      <div className="section-heading">
        <div>
          <p className="eyebrow">WEEKLY PLAN</p>
          <h2>本周安排</h2>
        </div>
        <div className="calendar-controls">
          <button type="button" className="icon-button" onClick={() => moveWeek(-1)} aria-label="上一周">
            <ChevronLeft size={18} />
          </button>
          <span className="week-range">
            {format(days[0], 'M月d日')} – {format(days[6], 'M月d日')}
          </span>
          <button type="button" className="icon-button" onClick={() => moveWeek(1)} aria-label="下一周">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="week-strip">
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd')
          const dayCheckIn = checkins[date]
          const tasks = getTasksForDate(date)
          const completedCount = tasks.filter((task) =>
            dayCheckIn?.completedTaskIds.includes(task.id),
          ).length
          const isComplete = tasks.length > 0 && completedCount === tasks.length
          const mode = getDayMode(date)
          const isToday = date === format(new Date(), 'yyyy-MM-dd')

          return (
            <button
              type="button"
              key={date}
              className={`week-day${date === selectedDate ? ' selected' : ''}${isToday ? ' today' : ''}`}
              onClick={() => onSelectDate(date)}
              aria-pressed={date === selectedDate}
              aria-label={`${WEEKDAYS[day.getDay()]} ${format(day, 'M月d日')}，${mode === 'TERM' ? '学期' : '假期'}，计划 ${getPlannedMinutesForDate(date)} 分钟${isComplete ? '，已完成' : ''}`}
            >
              <span className="weekday-label">{WEEKDAYS[day.getDay()]}</span>
              <span className="day-number">{format(day, 'd')}</span>
              <span className={`mode-label ${mode.toLowerCase()}`}>
                {mode === 'TERM' ? '学期' : '假期'}
              </span>
              <span className="day-plan">{getPlannedMinutesForDate(date)} 分钟</span>
              <span className={`day-status${isComplete ? ' done' : ''}`}>
                {isComplete ? (
                  <><Check size={13} /> 完成</>
                ) : completedCount > 0 ? (
                  `${completedCount}/${tasks.length}`
                ) : (
                  '待打卡'
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
