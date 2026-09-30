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
    <figure className="min-w-0 rounded-lg bg-white p-4 shadow">
      <figcaption className="font-semibold">{title}</figcaption>
      {empty ? (
        <p className="flex h-64 items-center justify-center text-center text-gray-500">{emptyText}</p>
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
