import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { EventFinance } from '../../types/finance'
import { shortenLabel } from '../../utils/chartLabels'
import { formatINR, formatINRShort } from '../../utils/money'
import ChartCard from './ChartCard'
import { chartColors } from './chartColors'

// Income (green) next to expenses (red), one pair of bars per event
function IncomeExpenseChart({ events }: { events: EventFinance[] }) {
  const data = events.map((event) => ({
    name: event.eventTitle,
    Income: Number(event.totalIncome),
    Expenses: Number(event.totalExpenses),
  }))
  const summary = events
    .map((e) => `${e.eventTitle}: income ${formatINR(e.totalIncome)}, expenses ${formatINR(e.totalExpenses)}.`)
    .join(' ')

  return (
    <ChartCard
      title="Income vs Expenses"
      summary={summary}
      empty={data.every((d) => d.Income === 0 && d.Expenses === 0)}
      emptyText="No income or expenses recorded yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickFormatter={shortenLabel} />
          <YAxis tickFormatter={formatINRShort} width={56} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatINR(Number(value))} />
          <Legend />
          <Bar dataKey="Income" fill={chartColors.income} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expenses" fill={chartColors.expenses} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default IncomeExpenseChart
