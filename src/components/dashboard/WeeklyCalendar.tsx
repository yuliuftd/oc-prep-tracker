import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDayMode, getPlannedMinutesForDate, getTasksForDate } from '../../utils/scheduleEngine'
import type { CheckInMap, HolidayRange } from '../../types'

interface WeeklyCalendarProps {
  selectedDate: string
  checkins: CheckInMap
  holidayOverrides?: HolidayRange[]
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeeklyCalendar({
  selectedDate,
  checkins,
  holidayOverrides = [],
  onSelectDate,
}: WeeklyCalendarProps) {
  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  const moveWeek = (amount: number) => {
    onSelectDate(format(addDays(parseISO(selectedDate), amount * 7), 'yyyy-MM-dd'))
  }

  return (
    <section className="calendar-panel panel" aria-label="Weekly study calendar">
      <div className="section-heading">
        <div>
          <p className="eyebrow">WEEKLY PLAN</p>
          <h2>This Week</h2>
        </div>
        <div className="calendar-controls">
          <button type="button" className="icon-button" onClick={() => moveWeek(-1)} aria-label="Previous week">
            <ChevronLeft size={18} />
          </button>
          <span className="week-range">
            {format(days[0], 'MMM d')} – {format(days[6], 'MMM d')}
          </span>
          <button type="button" className="icon-button" onClick={() => moveWeek(1)} aria-label="Next week">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="week-strip">
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd')
          const dayCheckIn = checkins[date]
          const tasks = getTasksForDate(date, holidayOverrides)
          const completedCount = tasks.filter((task) =>
            dayCheckIn?.completedTaskIds.includes(task.id),
          ).length
          const isComplete = tasks.length > 0 && completedCount === tasks.length
          const mode = getDayMode(date, holidayOverrides)
          const isToday = date === format(new Date(), 'yyyy-MM-dd')

          return (
            <button
              type="button"
              key={date}
              className={`week-day${date === selectedDate ? ' selected' : ''}${isToday ? ' today' : ''}`}
              onClick={() => onSelectDate(date)}
              aria-pressed={date === selectedDate}
              aria-label={`${WEEKDAYS[day.getDay()]} ${format(day, 'MMM d')}, ${mode === 'TERM' ? 'Term' : 'Holiday'}, planned ${getPlannedMinutesForDate(date, holidayOverrides)} minutes${isComplete ? ', complete' : ''}`}
            >
              <span className="weekday-label">{WEEKDAYS[day.getDay()]}</span>
              <span className="day-number">{format(day, 'd')}</span>
              <span className={`mode-label ${mode.toLowerCase()}`}>
                {mode === 'TERM' ? 'Term' : 'Holiday'}
              </span>
              <span className="day-plan">{getPlannedMinutesForDate(date, holidayOverrides)} min</span>
              <span className={`day-status${isComplete ? ' done' : ''}`}>
                {isComplete ? (
                  <><Check size={13} /> Done</>
                ) : completedCount > 0 ? (
                  `${completedCount}/${tasks.length}`
                ) : (
                  'To do'
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
