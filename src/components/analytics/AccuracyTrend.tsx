import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CheckInMap, QuizScoreLog } from '../../types'

interface AccuracyTrendProps {
  checkins: CheckInMap
}

type MetricKey = 'readingFirst' | 'readingRetry' | 'math' | 'thinking'

interface TestEvent {
  date: string
  testName: string
  order: number
  log: QuizScoreLog
}

interface TrendPoint {
  date: string
  testName: string
  readingFirst: number | null
  readingRetry: number | null
  math: number | null
  thinking: number | null
}

const SERIES: { key: MetricKey; label: string; color: string }[] = [
  { key: 'readingFirst', label: '阅读一刷', color: '#bd6b83' },
  { key: 'readingRetry', label: '阅读盲改', color: '#9271bd' },
  { key: 'math', label: '数学', color: '#4d8fb1' },
  { key: 'thinking', label: '思维', color: '#d29248' },
]

function getMetric(log: QuizScoreLog): MetricKey {
  if (log.subject === 'READING') {
    return 'readingFirst'
  }
  return log.subject === 'MATH' ? 'math' : 'thinking'
}

function rollingAverage(values: number[]): number {
  const window = values.slice(-5)
  return window.reduce((sum, value) => sum + value, 0) / window.length
}

export default function AccuracyTrend({ checkins }: AccuracyTrendProps) {
  const data = useMemo(() => {
    const events: TestEvent[] = Object.values(checkins)
      .flatMap((checkin) =>
        checkin.quizLogs.map((log, order) => ({
          date: checkin.date,
          testName: log.testName,
          order,
          log,
        })),
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)

    const history: Record<MetricKey, number[]> = {
      readingFirst: [],
      readingRetry: [],
      math: [],
      thinking: [],
    }
    const latest: Record<MetricKey, number | null> = {
      readingFirst: null,
      readingRetry: null,
      math: null,
      thinking: null,
    }
    const points: TrendPoint[] = []

    for (const event of events) {
      const { log } = event
      if (
        !Number.isFinite(log.totalQuestions) ||
        log.totalQuestions <= 0 ||
        !Number.isFinite(log.firstAttemptScore) ||
        log.firstAttemptScore < 0
      ) {
        continue
      }
      const key = getMetric(log)
      const score = (log.firstAttemptScore / log.totalQuestions) * 100
      history[key].push(score)
      latest[key] = rollingAverage(history[key])

      if (
        log.subject === 'READING' &&
        log.blindRetryScore !== undefined &&
        Number.isFinite(log.blindRetryScore) &&
        log.blindRetryScore >= 0
      ) {
        history.readingRetry.push((log.blindRetryScore / log.totalQuestions) * 100)
        latest.readingRetry = rollingAverage(history.readingRetry)
      }

      points.push({
        date: event.date,
        testName: event.testName,
        ...latest,
      })
    }
    return points
  }, [checkins])

  return (
    <section className="analytics-panel panel">
      <div className="section-heading chart-heading">
        <div>
          <p className="eyebrow">RECENT TEST PERFORMANCE</p>
          <h2>近五次测验正确率</h2>
        </div>
        <span className="target-pill">目标 80%</span>
      </div>
      <div className="chart-legend trend-legend">
        {SERIES.map((series) => (
          <span key={series.key}><i style={{ background: series.color }} />{series.label}</span>
        ))}
      </div>
      {data.length === 0 ? (
        <p className="chart-empty">添加测验成绩后，这里会显示近五次测验的滚动平均正确率。</p>
      ) : (
        <div className="chart-wrap trend-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 14, bottom: 2, left: -12 }}>
              <CartesianGrid stroke="#edf1ed" strokeDasharray="3 5" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => format(parseISO(value), 'M/d')}
                interval={Math.max(0, Math.ceil(data.length / 7) - 1)}
                tick={{ fill: '#8a978e', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#e5ebe6' }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tick={{ fill: '#8a978e', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={43}
              />
              <Tooltip
                labelFormatter={(value, payload) => {
                  const point = payload?.[0]?.payload as TrendPoint | undefined
                  const date = format(parseISO(String(value)), 'M月d日')
                  return point?.testName ? `${date} · ${point.testName}` : date
                }}
                formatter={(value, name) => [
                  value === null || value === undefined ? '暂无数据' : `${Number(value).toFixed(1)}%`,
                  SERIES.find((series) => series.key === name)?.label ?? String(name),
                ]}
                contentStyle={{
                  border: '1px solid #e6ece7',
                  borderRadius: 10,
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={80}
                stroke="#4b9b70"
                strokeDasharray="5 5"
                label={{ value: '80%', position: 'insideTopRight', fill: '#4b9b70', fontSize: 10 }}
              />
              {SERIES.map((series) => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={2.2}
                  connectNulls
                  dot={{ r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="chart-note">每条曲线按该科目最近最多 5 次测验计算滑动平均。</p>
    </section>
  )
}
