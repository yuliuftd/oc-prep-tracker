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
import { NSW_SCHOOL_HOLIDAYS } from '../../config/scheduleConfig'
import type { CheckInMap } from '../../types'
import { generateBurnUpSeries } from '../../utils/scheduleEngine'

interface BurnUpChartProps {
  checkins: CheckInMap
}

export default function BurnUpChart({ checkins }: BurnUpChartProps) {
  const data = generateBurnUpSeries(checkins)
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
      ? '正好在计划进度'
      : `${Math.abs(difference).toLocaleString()} 分钟${difference > 0 ? '领先' : '落后'}计划`

  return (
    <section className="analytics-panel panel burnup-panel">
      <div className="section-heading chart-heading">
        <div>
          <p className="eyebrow">26-WEEK STUDY PROGRESS</p>
          <h2>累计学习时长</h2>
        </div>
        <div className={`pace-indicator ${difference >= 0 ? 'ahead' : 'behind'}`}>
          <span>{difference > 0 ? '领先' : difference < 0 ? '落后' : '达成'}</span>
          <strong>{differenceLabel}</strong>
          <small>截至 {format(parseISO(asOfDate), 'M月d日')}</small>
        </div>
      </div>

      <div className="chart-legend">
        <span><i className="legend-planned" />计划累计</span>
        <span><i className="legend-actual" />实际累计</span>
        <span><i className="legend-holiday" />学校假期</span>
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
            {NSW_SCHOOL_HOLIDAYS.map((holiday, index) => (
              <ReferenceArea
                key={holiday.name}
                x1={holiday.startDate}
                x2={holiday.endDate}
                fill={index === 0 ? '#f6c875' : '#f2a28a'}
                fillOpacity={0.12}
                ifOverflow="hidden"
              />
            ))}
            <CartesianGrid stroke="#edf1ed" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => format(parseISO(value), 'M/d')}
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
              labelFormatter={(value) => format(parseISO(String(value)), 'yyyy年M月d日')}
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} 分钟`,
                name === 'plannedMinutes' ? '计划累计' : '实际累计',
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
              name="实际累计"
              stroke="#37875f"
              strokeWidth={2.5}
              fill="url(#actualStudyFill)"
              activeDot={{ r: 4, fill: '#37875f', strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="stepAfter"
              dataKey="plannedMinutes"
              name="计划累计"
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
        <span><i className="summer-swatch" /> 暑假加速期：12/18 – 1/31</span>
        <span><i className="autumn-swatch" /> 秋假冲刺期：4/10 – 4/25</span>
      </div>
    </section>
  )
}
