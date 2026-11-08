import { lazy, Suspense, useState } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ArrowDownRight } from 'lucide-react'
import CheckInModal from './components/dashboard/CheckInModal'
import TodayQuests from './components/dashboard/TodayQuests'
import WeeklyCalendar from './components/dashboard/WeeklyCalendar'
import Navbar, { type AppView } from './components/layout/Navbar'
import ConfigModal from './components/settings/ConfigModal'
import { getCheckins, getSettings, saveCheckins, syncCheckinsWithGitHub } from './services/storageService'
import { createEmptyCheckIn, getCurrentStreak, getTasksForDate } from './utils/scheduleEngine'
import { EXAM_DATE } from './config/scheduleConfig'
import type { AppSettings, CheckInMap, DailyCheckIn, PlannerData } from './types'
import './components/dashboard/dashboard.css'

const AnalyticsView = lazy(() => import('./components/analytics/AnalyticsView'))

function App() {
  const [checkins, setCheckins] = useState<CheckInMap>(() => getCheckins())
  const [settings, setSettings] = useState<AppSettings>(() => getSettings())
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [isCheckInOpen, setIsCheckInOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('')
  const [activeView, setActiveView] = useState<AppView>('planner')
  const holidayOverrides = settings.holidayOverrides ?? []
  const tasks = getTasksForDate(selectedDate, holidayOverrides)
  const selectedCheckIn = checkins[selectedDate]
  const daysUntilExam = Math.max(
    0,
    differenceInCalendarDays(parseISO(EXAM_DATE), new Date()),
  )

  const persistCheckins = (updated: CheckInMap) => {
    saveCheckins(updated)
    setCheckins(updated)
  }

  const toggleTask = (taskId: string) => {
    const current = checkins[selectedDate] ?? createEmptyCheckIn(selectedDate, holidayOverrides)
    const completedTaskIds = current.completedTaskIds.includes(taskId)
      ? current.completedTaskIds.filter((id) => id !== taskId)
      : [...current.completedTaskIds, taskId]
    persistCheckins({
      ...checkins,
      [selectedDate]: { ...current, completedTaskIds },
    })
  }

  const saveCheckIn = (checkin: DailyCheckIn) => {
    persistCheckins({ ...checkins, [checkin.date]: checkin })
    setIsCheckInOpen(false)
  }

  const syncData = async () => {
    if (!settings.githubToken || !settings.githubRepo) {
      setIsConfigOpen(true)
      return
    }
    setIsSyncing(true)
    setSyncStatus('')
    try {
      const synced = await syncCheckinsWithGitHub(settings, checkins)
      setCheckins(synced)
      setSyncStatus('Synced')
    } catch (reason) {
      setSyncStatus(reason instanceof Error ? reason.message : 'Sync failed')
    } finally {
      setIsSyncing(false)
    }
  }

  const streak = getCurrentStreak(checkins)

  return (
    <main className="app-shell">
      <Navbar
        daysUntilExam={daysUntilExam}
        streak={streak}
        activeView={activeView}
        isSyncing={isSyncing}
        onViewChange={setActiveView}
        onOpenSettings={() => setIsConfigOpen(true)}
        onSync={() => void syncData()}
      />
      {syncStatus && (
        <p className={`sync-status${syncStatus === 'Synced' ? ' success' : ' error'}`} role="status">
          {syncStatus}
        </p>
      )}

      <section className="welcome-section">
        <div>
          <p className="eyebrow"><span className="status-dot" /> YOUR STUDY SPACE</p>
          <h1>
            {activeView === 'planner' ? (
              <>One step at a time, <span>you’ve got this.</span></>
            ) : (
              <>See your progress, <span>find your focus.</span></>
            )}
          </h1>
          <p className="welcome-copy">
            {activeView === 'planner'
              ? 'Make a little progress today. A steady rhythm beats a last-minute sprint.'
              : 'Review your study habits and Reading errors to make every practice count.'}
          </p>
        </div>
        <div className="exam-date-card">
          <span>OC Placement Test</span>
          <strong>11 <small>MAY</small></strong>
          <span>2027 · Exam day</span>
          <ArrowDownRight className="exam-arrow" size={18} />
        </div>
      </section>

      {activeView === 'planner' ? (
        <>
          <WeeklyCalendar
            selectedDate={selectedDate}
            checkins={checkins}
            holidayOverrides={holidayOverrides}
            onSelectDate={setSelectedDate}
          />
          <TodayQuests
            date={selectedDate}
            tasks={tasks}
            completedTaskIds={selectedCheckIn?.completedTaskIds ?? []}
            settings={settings}
            onToggleTask={toggleTask}
            onOpenCheckIn={() => setIsCheckInOpen(true)}
          />
        </>
      ) : (
        <Suspense fallback={<div className="analytics-loading panel">Loading progress charts…</div>}>
          <AnalyticsView checkins={checkins} holidayOverrides={holidayOverrides} />
        </Suspense>
      )}

      <footer className="app-footer">
        <span>OC Prep Tracker</span>
        <span>Today’s effort builds tomorrow’s confidence.</span>
      </footer>

      {isCheckInOpen && (
        <CheckInModal
          key={selectedDate}
          date={selectedDate}
          checkin={selectedCheckIn}
          tasks={tasks}
          settings={settings}
          holidayOverrides={holidayOverrides}
          onSave={saveCheckIn}
          onClose={() => setIsCheckInOpen(false)}
        />
      )}
      {isConfigOpen && (
        <ConfigModal
          settings={settings}
          checkins={checkins}
          onClose={() => setIsConfigOpen(false)}
          onSettingsSaved={setSettings}
          onDataImported={(data: PlannerData) => {
            setCheckins(data.checkins)
            setSettings(data.settings)
          }}
          onCheckinsSynced={setCheckins}
        />
      )}
    </main>
  )
}

export default App
