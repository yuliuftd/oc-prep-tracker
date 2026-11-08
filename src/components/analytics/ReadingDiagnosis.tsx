import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CheckInMap, ReadingErrorBreakdown } from '../../types'

interface ReadingDiagnosisProps {
  checkins: CheckInMap
}

const SECTIONS: { key: keyof ReadingErrorBreakdown; label: string }[] = [
  { key: 'long_passage', label: 'Long passage' },
  { key: 'poetry', label: 'Poetry' },
  { key: 'cloze_gap_fill', label: 'Cloze gap-fill' },
  { key: 'multi_extract', label: 'Multi-extract matching' },
]

export default function ReadingDiagnosis({ checkins }: ReadingDiagnosisProps) {
  const data = useMemo(() => {
    const totals: ReadingErrorBreakdown = {
      long_passage: 0,
      poetry: 0,
      cloze_gap_fill: 0,
      multi_extract: 0,
    }
    for (const checkin of Object.values(checkins)) {
      for (const log of checkin.quizLogs) {
        if (log.subject !== 'READING' || !log.readingBreakdown) {
          continue
        }
        for (const { key } of SECTIONS) {
          const errors = log.readingBreakdown[key]
          if (Number.isFinite(errors) && errors > 0) {
            totals[key] += errors
          }
        }
      }
    }

    const allErrors = Object.values(totals).reduce((sum, value) => sum + value, 0)
    const highest = Math.max(...Object.values(totals))
    return SECTIONS.map(({ key, label }) => ({
      key,
      label,
      errors: totals[key],
      share: allErrors === 0 ? 0 : (totals[key] / allErrors) * 100,
      isWeakest: highest > 0 && totals[key] === highest,
    }))
  }, [checkins])

  const totalErrors = data.reduce((sum, section) => sum + section.errors, 0)
  const weakest = data.find((section) => section.isWeakest)

  return (
    <section className="analytics-panel panel">
      <div className="section-heading chart-heading">
        <div>
          <p className="eyebrow">READING ERROR BREAKDOWN</p>
          <h2>Reading Error Breakdown</h2>
        </div>
        <span className="error-total">{totalErrors} <small>total errors</small></span>
      </div>
      {totalErrors === 0 ? (
        <p className="chart-empty">Record Reading errors by section to see your areas for improvement.</p>
      ) : (
        <>
          {weakest && (
            <div className="weakest-callout">
              <span className="weakest-marker" />
              Focus next: <strong>{weakest.label}</strong>
              <span>{weakest.share.toFixed(0)}% of errors are in this section</span>
            </div>
          )}
          <div className="chart-wrap diagnosis-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 34, bottom: 3, left: 6 }}
              >
                <CartesianGrid stroke="#edf1ed" strokeDasharray="3 5" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: '#8a978e', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5ebe6' }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fill: '#627168', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={67}
                />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value} errors (${Number(item.payload.share).toFixed(1)}%)`,
                    'Total errors',
                  ]}
                  contentStyle={{
                    border: '1px solid #e6ece7',
                    borderRadius: 10,
                    fontSize: 10,
                  }}
                />
                <Bar dataKey="errors" name="Total errors" barSize={17} radius={[0, 7, 7, 0]}>
                  {data.map((section) => (
                    <Cell
                      key={section.key}
                      fill={section.isWeakest ? '#d78362' : '#7fb497'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="diagnosis-share">
            {data.map((section) => (
              <span key={section.key}>
                <strong>{section.errors}</strong> {section.label}
                <small>{section.share.toFixed(0)}%</small>
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
