import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns'
import {
  EXAM_DATE,
  HOLIDAY_READING_TASK,
  HOLIDAY_ROTATION_TASKS,
  HOLIDAY_SATURDAY_TEMPLATE,
  HOLIDAY_VOCAB_TASK,
  NSW_SCHOOL_HOLIDAYS,
  PLAN_START_DATE,
  TERM_WEEKLY_TEMPLATE,
} from '../config/scheduleConfig'
import type {
  AppSettings,
  BurnUpPoint,
  CheckInMap,
  DailyCheckIn,
  DayMode,
  TaskTemplate,
  Weekday,
} from '../types'

type DateInput = Date | string

const dateKey = (date: DateInput): string => {
  if (typeof date === 'string') {
    return date.slice(0, 10)
  }
  return format(date, 'yyyy-MM-dd')
}

const weekdayOf = (date: DateInput): Weekday =>
  parseISO(dateKey(date)).getDay() as Weekday

export function getDayMode(date: DateInput): DayMode {
  const key = dateKey(date)
  return NSW_SCHOOL_HOLIDAYS.some(
    ({ startDate, endDate }) => key >= startDate && key <= endDate,
  )
    ? 'HOLIDAY'
    : 'TERM'
}

export function getTasksForDate(date: DateInput): TaskTemplate[] {
  const key = dateKey(date)
  const weekday = weekdayOf(date)

  if (getDayMode(key) === 'TERM') {
    return TERM_WEEKLY_TEMPLATE[weekday]
  }
  if (weekday === 6) {
    return HOLIDAY_SATURDAY_TEMPLATE
  }

  const daysFromStart = Math.floor(
    (parseISO(key).getTime() - parseISO(PLAN_START_DATE).getTime()) / 86_400_000,
  )
  const rotationTask = HOLIDAY_ROTATION_TASKS[Math.abs(daysFromStart) % 2]
  return [HOLIDAY_READING_TASK, rotationTask, HOLIDAY_VOCAB_TASK]
}

export function getCurrentStreak(
  checkins: CheckInMap,
  asOfDate: DateInput = new Date(),
): number {
  const todayKey = dateKey(asOfDate)
  const firstDate = checkins[todayKey] ? todayKey : dateKey(addDays(parseISO(todayKey), -1))
  let streak = 0

  for (let cursor = parseISO(firstDate); ; cursor = addDays(cursor, -1)) {
    if (!checkins[dateKey(cursor)]) {
      return streak
    }
    streak += 1
  }
}

export function generateBurnUpSeries(
  checkins: CheckInMap,
  startDate = PLAN_START_DATE,
  endDate = EXAM_DATE,
): BurnUpPoint[] {
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })
  let plannedMinutes = 0
  let actualMinutes = 0

  return dates.map((date) => {
    const key = format(date, 'yyyy-MM-dd')
    plannedMinutes += getTasksForDate(key).reduce(
      (total, dailyTask) => total + dailyTask.durationMinutes,
      0,
    )
    actualMinutes += checkins[key]?.actualMinutes ?? 0
    return { date: key, plannedMinutes, actualMinutes }
  })
}

export function getPlannedMinutesForDate(date: DateInput): number {
  return getTasksForDate(date).reduce(
    (total, dailyTask) => total + dailyTask.durationMinutes,
    0,
  )
}

export function getTaskUrl(task: TaskTemplate, settings: AppSettings): string | undefined {
  switch (task.externalLinkType) {
    case 'SPELLING_BEE_OC_BROWSE':
      return createSpellingBeeUrl(settings.spellingBeeBaseUrl, 'browse')
    case 'SPELLING_BEE_OC_QUIZ':
      return createSpellingBeeUrl(settings.spellingBeeBaseUrl, 'quiz')
    case 'COACHING_PORTAL':
      return settings.coachingPortalUrl || undefined
    case 'NONE':
      return undefined
  }
}

function createSpellingBeeUrl(baseUrl: string, view: 'browse' | 'quiz'): string | undefined {
  if (!baseUrl) {
    return undefined
  }
  const url = new URL(baseUrl)
  url.searchParams.set('mode', 'oc')
  url.searchParams.set('view', view)
  return url.toString()
}

export function createEmptyCheckIn(date: DateInput): DailyCheckIn {
  const key = dateKey(date)
  return {
    date: key,
    dayMode: getDayMode(key),
    plannedMinutes: getPlannedMinutesForDate(key),
    actualMinutes: 0,
    completedTaskIds: [],
    quizLogs: [],
    vocabSyncedToSpellingBee: false,
  }
}
