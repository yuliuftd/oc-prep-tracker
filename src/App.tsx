import { lazy, Suspense, useState } from 'react'
import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { ArrowDownRight } from 'lucide-react'
import CheckInModal from './components/dashboard/CheckInModal'
import TodayQuests from './components/dashboard/TodayQuests'
import WeeklyCalendar from './components/dashboard/WeeklyCalendar'
import Navbar, { type AppView } from './components/layout/Navbar'
import ConfigModal from './components/settings/ConfigModal'
import { getCheckins, getSettings, saveCheckins } from './services/storageService'
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
  const [activeView, setActiveView] = useState<AppView>('planner')
  const tasks = getTasksForDate(selectedDate)
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
    const current = checkins[selectedDate] ?? createEmptyCheckIn(selectedDate)
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

  const streak = getCurrentStreak(checkins)

  return (
    <main className="app-shell">
      <Navbar
        daysUntilExam={daysUntilExam}
        streak={streak}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenSettings={() => setIsConfigOpen(true)}
      />

      <section className="welcome-section">
        <div>
          <p className="eyebrow"><span className="status-dot" /> YOUR STUDY SPACE</p>
          <h1>
            {activeView === 'planner' ? (
              <>一步一步，<span>稳稳上岸。</span></>
            ) : (
              <>看见进步，<span>找到方向。</span></>
            )}
          </h1>
          <p className="welcome-copy">
            {activeView === 'planner'
              ? '今天也为目标前进一点点。保持节奏，比一次冲刺更重要。'
              : '复盘学习节奏与阅读错题，让每一次练习都有收获。'}
          </p>
        </div>
        <div className="exam-date-card">
          <span>OC Placement Test</span>
          <strong>11 <small>MAY</small></strong>
          <span>2027 · 考试日</span>
          <ArrowDownRight className="exam-arrow" size={18} />
        </div>
      </section>

      {activeView === 'planner' ? (
        <>
          <WeeklyCalendar
            selectedDate={selectedDate}
            checkins={checkins}
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
        <Suspense fallback={<div className="analytics-loading panel">正在加载进度图表…</div>}>
          <AnalyticsView checkins={checkins} />
        </Suspense>
      )}

      <footer className="app-footer">
        <span>OC Prep Tracker</span>
        <span>今天的努力，会成为明天的底气。</span>
      </footer>

      {isCheckInOpen && (
        <CheckInModal
          key={selectedDate}
          date={selectedDate}
          checkin={selectedCheckIn}
          tasks={tasks}
          settings={settings}
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
