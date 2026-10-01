import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { shortenLabel } from '../../utils/chartLabels'
import { formatINR, formatINRShort } from '../../utils/money'
import ChartCard from './ChartCard'
import { chartColors } from './chartColors'

export interface BalanceBar {
  name: string
  value: number
  kind: 'income' | 'expenses' | 'balance'
}

const COLORS = { income: chartColors.income, expenses: chartColors.expenses, balance: chartColors.balance }

// The remaining balance. With several events: one bar per event (red when below zero).
// For one event: Income, Expenses and Balance side by side.
function BalanceChart({ bars }: { bars: BalanceBar[] }) {
  const summary = bars.map((bar) => `${bar.name}: ${formatINR(bar.value)}.`).join(' ')

  return (
    <ChartCard
      title="Financial Balance"
      summary={summary}
      empty={bars.every((bar) => bar.value === 0)}
      emptyText="No financial data available yet."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bars} margin={{ left: 4, right: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickFormatter={shortenLabel} />
          <YAxis tickFormatter={formatINRShort} width={56} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatINR(Number(value))} />
          <ReferenceLine y={0} stroke={chartColors.axis} />
          <Bar dataKey="value" name="Amount" radius={[4, 4, 0, 0]}>
            {bars.map((bar, index) => (
              <Cell key={`${bar.name}-${index}`} fill={bar.kind === 'balance' && bar.value < 0 ? COLORS.expenses : COLORS[bar.kind]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default BalanceChart
