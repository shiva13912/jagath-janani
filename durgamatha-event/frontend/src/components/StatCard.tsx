interface StatCardProps {
  label: string
  value: string
  tone?: 'neutral' | 'positive' | 'negative'
}

const toneClass = {
  neutral: 'text-gray-900',
  positive: 'text-green-700',
  negative: 'text-red-700',
}

// One number on a dashboard, e.g. "Total Income ₹1,50,000.00"
function StatCard({ label, value, tone = 'neutral' }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`mt-1 break-words text-xl font-bold sm:text-2xl ${toneClass[tone]}`}>{value}</dd>
    </div>
  )
}

// Grey boxes shown while numbers load, instead of zeros that would look like real data
export function StatCardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
      ))}
    </div>
  )
}

export default StatCard
