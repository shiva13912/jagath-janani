import type { ReactNode } from 'react'
import { cardClass } from './Card'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  hideBelow?: 'lg' // a less important column, left out of the table on tablets
}

interface ResponsiveTableProps<T> {
  rows: T[]
  rowKey: (row: T) => string
  columns: Column<T>[] // the first column is the row's title
  actions?: (row: T) => ReactNode // Edit / Delete buttons
  caption: string // describes the table for screen readers
}

// Tablets and computers: a normal table. Phones: one card per row, so nothing is squeezed
// and nothing scrolls sideways. Used by the events, albums, income and expense pages.
function ResponsiveTable<T>({ rows, rowKey, columns, actions, caption }: ResponsiveTableProps<T>) {
  const [titleColumn, ...otherColumns] = columns

  return (
    <>
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className={`${cardClass} p-4`}>
            <div className="font-semibold text-ink">{titleColumn.cell(row)}</div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {otherColumns.map((column) => (
                <div key={column.header} className="contents">
                  <dt className="text-muted">{column.header}</dt>
                  <dd className="min-w-0 break-words text-ink">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions(row)}</div>}
          </li>
        ))}
      </ul>

      <div className={`hidden overflow-x-auto md:block ${cardClass}`}>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-page text-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${column.align === 'right' ? 'text-right' : ''} ${column.hideBelow ? 'hidden lg:table-cell' : ''}`}
                >
                  {column.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-page/60">
                {columns.map((column, index) => (
                  <td
                    key={column.header}
                    className={`px-4 py-3 ${index === 0 ? 'font-medium text-ink' : 'text-ink'} ${column.align === 'right' ? 'whitespace-nowrap text-right' : ''} ${column.hideBelow ? 'hidden lg:table-cell' : ''}`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

// Grey rows shown while a table loads
export function SkeletonTable({ rows = 4, label = 'Loading...' }: { rows?: number; label?: string }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      <div className={`${cardClass} divide-y divide-line`} aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-4 px-4 py-4">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-1/4 rounded bg-gray-200" />
            <div className="ml-auto h-8 w-24 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResponsiveTable
