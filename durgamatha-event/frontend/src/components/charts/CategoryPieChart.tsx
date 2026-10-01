import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoryTotal } from '../../types/finance'
import { formatINR } from '../../utils/money'
import ChartCard from './ChartCard'

// One colour per category (the 10 categories in a fixed order, so a category keeps its colour)
const COLORS: Record<string, string> = {
  Food: '#ea580c',
  Decoration: '#db2777',
  Transportation: '#2563eb',
  Equipment: '#7c3aed',
  Venue: '#0d9488',
  Printing: '#ca8a04',
  'Sound & Lighting': '#4f46e5',
  Gifts: '#e11d48',
  Maintenance: '#65a30d',
  Other: '#6b7280',
}

// How the expenses are split between categories
function CategoryPieChart({ categories }: { categories: CategoryTotal[] }) {
  const data = categories.map((c) => ({ name: c.category, value: Number(c.total) }))
  const summary = categories.map((c) => `${c.category}: ${formatINR(c.total)}.`).join(' ')

  return (
    <ChartCard title="Expenses by Category" summary={summary} empty={data.length === 0} emptyText="No expenses recorded yet.">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={1}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] ?? '#6b7280'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatINR(Number(value))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default CategoryPieChart
