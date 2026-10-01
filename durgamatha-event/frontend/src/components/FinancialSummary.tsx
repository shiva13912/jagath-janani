import type { FinancialSummary as Summary } from '../types/finance'
import { formatINR } from '../utils/money'
import StatCard from './StatCard'

interface Counts {
  totalEvents?: number
  totalAlbums: number
  totalPhotos: number
  totalVideos: number
}

// The summary cards used on both dashboards and on the event page:
// money first (Income, Expenses, Balance), then the media counts.
function FinancialSummary({ summary, counts }: { summary: Summary; counts?: Counts }) {
  const balance = Number(summary.remainingBalance)
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {counts?.totalEvents !== undefined && <StatCard label="Total Events" value={String(counts.totalEvents)} />}
      <StatCard label="Total Income" value={formatINR(summary.totalIncome)} tone="positive" />
      <StatCard label="Total Expenses" value={formatINR(summary.totalExpenses)} tone="negative" />
      <StatCard label="Remaining Balance" value={formatINR(summary.remainingBalance)} tone={balance < 0 ? 'negative' : 'neutral'} />
      {counts && (
        <>
          <StatCard label="Albums" value={String(counts.totalAlbums)} />
          <StatCard label="Photos" value={String(counts.totalPhotos)} />
          <StatCard label="Videos" value={String(counts.totalVideos)} />
        </>
      )}
    </dl>
  )
}

export default FinancialSummary
