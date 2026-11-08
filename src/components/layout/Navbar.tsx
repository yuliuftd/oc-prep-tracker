import { CalendarDays, ChartNoAxesCombined, Flame, Settings, Sparkles } from 'lucide-react'

export type AppView = 'planner' | 'analytics'

interface NavbarProps {
  daysUntilExam: number
  streak: number
  activeView: AppView
  onViewChange: (view: AppView) => void
  onOpenSettings: () => void
}

export default function Navbar({
  daysUntilExam,
  streak,
  activeView,
  onViewChange,
  onOpenSettings,
}: NavbarProps) {
  return (
    <header className="topbar">
      <a href="#" className="brand" aria-label="OC Prep 首页">
        <span className="brand-mark"><Sparkles size={19} /></span>
        <span>OC<span className="brand-light">PREP</span></span>
      </a>
      <nav className="main-nav" aria-label="主导航">
        <button
          type="button"
          className={`nav-tab${activeView === 'planner' ? ' active' : ''}`}
          onClick={() => onViewChange('planner')}
          aria-pressed={activeView === 'planner'}
        >
          <CalendarDays size={16} /> 今日计划与打卡
        </button>
        <button
          type="button"
          className={`nav-tab${activeView === 'analytics' ? ' active' : ''}`}
          onClick={() => onViewChange('analytics')}
          aria-pressed={activeView === 'analytics'}
        >
          <ChartNoAxesCombined size={16} /> 进度与阅读诊断
        </button>
      </nav>
      <div className="topbar-status">
        <div className="streak-pill"><Flame size={16} /> <strong>{streak}</strong> 天连续打卡</div>
        <div className="exam-pill"><span>距考试</span><strong>{daysUntilExam}</strong><span>天</span></div>
        <button
          type="button"
          className="settings-button"
          onClick={onOpenSettings}
          aria-label="打开设置"
          title="设置"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  )
}
