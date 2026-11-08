import { CalendarDays, ChartNoAxesCombined, Flame, RefreshCw, Settings, Sparkles } from 'lucide-react'

export type AppView = 'planner' | 'analytics'

interface NavbarProps {
  daysUntilExam: number
  streak: number
  activeView: AppView
  isSyncing: boolean
  onViewChange: (view: AppView) => void
  onOpenSettings: () => void
  onSync: () => void
}

export default function Navbar({
  daysUntilExam,
  streak,
  activeView,
  isSyncing,
  onViewChange,
  onOpenSettings,
  onSync,
}: NavbarProps) {
  return (
    <header className="topbar">
      <a href="#" className="brand" aria-label="OC Prep home">
        <span className="brand-mark"><Sparkles size={19} /></span>
        <span>OC<span className="brand-light">PREP</span></span>
      </a>
      <nav className="main-nav" aria-label="Main navigation">
        <button
          type="button"
          className={`nav-tab${activeView === 'planner' ? ' active' : ''}`}
          onClick={() => onViewChange('planner')}
          aria-pressed={activeView === 'planner'}
        >
          <CalendarDays size={16} /> Today’s Plan & Check-in
        </button>
        <button
          type="button"
          className={`nav-tab${activeView === 'analytics' ? ' active' : ''}`}
          onClick={() => onViewChange('analytics')}
          aria-pressed={activeView === 'analytics'}
        >
          <ChartNoAxesCombined size={16} /> Progress & Reading Review
        </button>
      </nav>
      <div className="topbar-status">
        <div className="streak-pill"><Flame size={16} /> <strong>{streak}</strong> day streak</div>
        <div className="exam-pill"><span>Exam in</span><strong>{daysUntilExam}</strong><span>days</span></div>
        <button
          type="button"
          className="sync-top-button"
          onClick={onSync}
          disabled={isSyncing}
          aria-label={isSyncing ? 'Syncing check-ins' : 'Sync check-ins with GitHub'}
          title={isSyncing ? 'Syncing…' : 'Sync check-ins'}
        >
          <RefreshCw className={isSyncing ? 'spin' : ''} size={15} />
          <span>{isSyncing ? 'Syncing' : 'Sync'}</span>
        </button>
        <button
          type="button"
          className="settings-button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  )
}
