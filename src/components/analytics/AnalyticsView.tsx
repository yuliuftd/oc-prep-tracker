import BurnUpChart from './BurnUpChart'
import AccuracyTrend from './AccuracyTrend'
import ReadingDiagnosis from './ReadingDiagnosis'
import type { CheckInMap } from '../../types'

interface AnalyticsViewProps {
  checkins: CheckInMap
}

export default function AnalyticsView({ checkins }: AnalyticsViewProps) {
  return (
    <section className="analytics-view">
      <BurnUpChart checkins={checkins} />
      <div className="analytics-grid">
        <AccuracyTrend checkins={checkins} />
        <ReadingDiagnosis checkins={checkins} />
      </div>
    </section>
  )
}
