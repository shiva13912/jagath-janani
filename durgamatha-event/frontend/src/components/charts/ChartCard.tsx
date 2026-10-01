import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  summary: string // the chart's numbers in words, read by screen readers
  empty: boolean
  emptyText: string
  children: ReactNode
}

// A white box with a heading around each chart. Charts are pictures, so the same numbers
// are also given as text for screen readers. With no data, a message replaces the chart.
function ChartCard({ title, summary, empty, emptyText, children }: ChartCardProps) {
  return (
    <figure className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <figcaption className="font-semibold text-ink">{title}</figcaption>
      {empty ? (
        <p className="flex h-64 items-center justify-center text-center text-muted">{emptyText}</p>
      ) : (
        <>
          <p className="sr-only">{summary}</p>
          <div className="mt-3 h-64" aria-hidden="true">
            {children}
          </div>
        </>
      )}
    </figure>
  )
}

export default ChartCard
