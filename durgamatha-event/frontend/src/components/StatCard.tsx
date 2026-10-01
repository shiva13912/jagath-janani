interface StatCardProps {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
}

const toneClass = {
  neutral: 'text-ink',
  positive: 'text-success',
  negative: 'text-danger',
}

// One number on a dashboard, e.g. "Total Income ₹1,50,000"
function StatCard({ label, value, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className={`mt-1 break-words text-xl font-bold sm:text-2xl ${toneClass[tone]}`}>{value}</dd>
    </div>
  )
}

// Grey boxes shown while numbers load, instead of zeros that would look like real data
export function StatCardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-[5.5rem] animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  )
}

export default StatCard
