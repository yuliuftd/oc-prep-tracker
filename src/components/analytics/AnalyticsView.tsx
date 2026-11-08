import BurnUpChart from './BurnUpChart'
import AccuracyTrend from './AccuracyTrend'
import ReadingDiagnosis from './ReadingDiagnosis'
import type { CheckInMap, HolidayRange } from '../../types'

interface AnalyticsViewProps {
  checkins: CheckInMap
  holidayOverrides: HolidayRange[]
}

export default function AnalyticsView({ checkins, holidayOverrides }: AnalyticsViewProps) {
  return (
    <section className="analytics-view">
      <BurnUpChart checkins={checkins} holidayOverrides={holidayOverrides} />
      <div className="analytics-grid">
        <AccuracyTrend checkins={checkins} />
        <ReadingDiagnosis checkins={checkins} />
      </div>
    </section>
  )
}
