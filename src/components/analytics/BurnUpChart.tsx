import { format, parseISO } from 'date-fns'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EXAM_DATE, NSW_SCHOOL_HOLIDAYS, PLAN_START_DATE } from '../../config/scheduleConfig'
import type { CheckInMap, HolidayRange } from '../../types'
import { generateBurnUpSeries } from '../../utils/scheduleEngine'

interface BurnUpChartProps {
  checkins: CheckInMap
  holidayOverrides?: HolidayRange[]
}

export default function BurnUpChart({
  checkins,
  holidayOverrides = [],
}: BurnUpChartProps) {
  const data = generateBurnUpSeries(checkins, PLAN_START_DATE, EXAM_DATE, holidayOverrides)
  const holidayRanges = [...NSW_SCHOOL_HOLIDAYS, ...holidayOverrides]
  const today = format(new Date(), 'yyyy-MM-dd')
  const currentPoint = data.filter((point) => point.date <= today).at(-1)
  const finalPoint = currentPoint ?? data.at(-1)!
  const asOfDate = currentPoint?.date ?? (today < data[0].date ? today : finalPoint.date)
  const plannedMinutes = currentPoint?.plannedMinutes ?? 0
  const actualMinutes = currentPoint?.actualMinutes ?? 0
  const difference =
    actualMinutes - plannedMinutes
  const differenceLabel =
    difference === 0
      ? 'On track'
      : `${Math.abs(difference).toLocaleString()} min ${difference > 0 ? 'ahead of' : 'behind'} plan`

  return (
    <section className="analytics-panel panel burnup-panel">
      <div className="section-heading chart-heading">
        <div>
          <p className="eyebrow">26-WEEK STUDY PROGRESS</p>
          <h2>Cumulative Study Time</h2>
        </div>
        <div className={`pace-indicator ${difference >= 0 ? 'ahead' : 'behind'}`}>
          <span>{difference > 0 ? 'Ahead' : difference < 0 ? 'Behind' : 'On track'}</span>
          <strong>{differenceLabel}</strong>
          <small>As of {format(parseISO(asOfDate), 'MMM d')}</small>
        </div>
      </div>

      <div className="chart-legend">
        <span><i className="legend-planned" />Planned total</span>
        <span><i className="legend-actual" />Actual total</span>
        <span><i className="legend-holiday" />School holidays</span>
      </div>
      <div className="chart-wrap burnup-chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 18, bottom: 4, left: 4 }}>
            <defs>
              <linearGradient id="actualStudyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a9a70" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#4a9a70" stopOpacity={0.025} />
              </linearGradient>
            </defs>
            {holidayRanges.map((holiday, index) => (
              <ReferenceArea
                key={holiday.name}
                x1={holiday.startDate}
                x2={holiday.endDate}
                fill={index === 0 ? '#f6c875' : index === 1 ? '#f2a28a' : '#9ebce0'}
                fillOpacity={0.12}
                ifOverflow="hidden"
              />
            ))}
            <CartesianGrid stroke="#edf1ed" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), 'MMM d')}
              interval={27}
              tick={{ fill: '#8a978e', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#e5ebe6' }}
              minTickGap={18}
            />
            <YAxis
              tickFormatter={(value: number) => `${Math.round(value / 60)}h`}
              tick={{ fill: '#8a978e', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              labelFormatter={(value) => format(parseISO(String(value)), 'MMM d, yyyy')}
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} min`,
                name === 'plannedMinutes' ? 'Planned total' : 'Actual total',
              ]}
              contentStyle={{
                border: '1px solid #e6ece7',
                borderRadius: 10,
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="actualMinutes"
              name="Actual total"
              stroke="#37875f"
              strokeWidth={2.5}
              fill="url(#actualStudyFill)"
              activeDot={{ r: 4, fill: '#37875f', strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="plannedMinutes"
              name="Planned total"
              stroke="#d59044"
              strokeWidth={2}
              strokeDasharray="6 5"
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="holiday-caption">
        {holidayRanges.map((holiday, index) => (
          <span key={`${holiday.name}-${holiday.startDate}`}>
            <i className={index === 0 ? 'summer-swatch' : index === 1 ? 'autumn-swatch' : 'custom-holiday-swatch'} />
            {holiday.name}: {format(parseISO(holiday.startDate), 'MMM d')} – {format(parseISO(holiday.endDate), 'MMM d')}
          </span>
        ))}
      </div>
    </section>
  )
}
