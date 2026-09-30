import { useCallback, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { useApiData } from '../hooks/useApiData'
import { getEvents } from '../services/eventService'
import { deleteExpense, deleteIncome, getExpensePage, getIncomePage } from '../services/financeService'
import { EXPENSE_CATEGORIES, type FinanceKind } from '../types/finance'
import type { Pagination as PaginationInfo } from '../types/media'
import { getErrorMessage } from '../utils/apiError'
import { formatEventDate } from '../utils/date'
import { formatINR } from '../utils/money'
import Pagination from './Pagination'

// One row of the table, the same shape for income and expenses
interface Row {
  id: string
  title: string
  eventTitle: string
  detail: string // expense category or income source
  amount: string
  date: string
}

interface FinanceRecordsProps {
  kind: FinanceKind
  canEdit: boolean // false for team members: no Add/Edit/Delete (and the backend refuses anyway)
  basePath: string // e.g. "/admin/expenses", used for the Add and Edit links
}

const inputClass =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300'

// The income or expenses list with filters (event, category, dates), pages and actions.
// Used by /admin/income, /admin/expenses and the read-only /team/finance.
// Filters live in the URL, so a refresh, Back or a shared link keeps them.
function FinanceRecords({ kind, canEdit, basePath }: FinanceRecordsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const isExpenses = kind === 'expenses'
  const noun = isExpenses ? 'expense' : 'income record'
  const plural = isExpenses ? 'expenses' : 'income records'

  const eventId = searchParams.get('event') ?? ''
  const category = isExpenses ? (searchParams.get('category') ?? '') : ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const hasFilters = Boolean(eventId || category || from || to)

  // A message passed by the create/edit form after saving, e.g. "Expense added."
  const savedMessage = (location.state as { message?: string } | null)?.message ?? ''
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [rowToDelete, setRowToDelete] = useState<Row | null>(null)
  const [deleting, setDeleting] = useState(false)

  const events = useApiData(getEvents)

  const load = useCallback(async (): Promise<{ rows: Row[]; pagination: PaginationInfo }> => {
    const filters = { page, eventId, category, from, to }
    if (isExpenses) {
      const result = await getExpensePage(filters)
      return {
        rows: result.expenses.map((r) => ({ id: r.id, title: r.title, eventTitle: r.event?.title ?? '', detail: r.category, amount: r.amount, date: r.spent_date })),
        pagination: result.pagination,
      }
    }
    const result = await getIncomePage(filters)
    return {
      rows: result.income.map((r) => ({ id: r.id, title: r.title, eventTitle: r.event?.title ?? '', detail: r.source, amount: r.amount, date: r.received_date })),
      pagination: result.pagination,
    }
  }, [isExpenses, page, eventId, category, from, to])
  const list = useApiData(load)

  // Changes some URL parameters, keeps the others (like ?tab=). A filter change goes back to page 1.
  function updateParams(changes: Record<string, string>) {
    setMessage('')
    setSearchParams(
      (params) => {
        const result = new URLSearchParams(params)
        if (!('page' in changes)) result.delete('page')
        for (const [key, value] of Object.entries(changes)) {
          if (!value || (key === 'page' && value === '1')) result.delete(key)
          else result.set(key, value)
        }
        return result
      },
      { replace: false, state: null }, // clears the "saved" message from the form
    )
  }

  async function confirmDelete() {
    if (!rowToDelete) return
    setDeleting(true)
    setActionError('')
    try {
      if (isExpenses) await deleteExpense(rowToDelete.id)
      else await deleteIncome(rowToDelete.id)
      setMessage(`"${rowToDelete.title}" was deleted.`)
      setRowToDelete(null)
      list.reload() // load the list again from the database
    } catch (err) {
      setActionError(getErrorMessage(err))
      setRowToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const rows = list.data?.rows ?? []
  const pagination = list.data?.pagination
  const emptyText = hasFilters
    ? `No ${plural} match these filters.`
    : events.data?.length === 0
      ? 'No events available.'
      : isExpenses
        ? 'No expenses recorded yet.'
        : 'No income records yet.'
  const shownMessage = message || savedMessage

  return (
    <div>
      {canEdit && (
        <Link
          to={`${basePath}/create${eventId ? `?event=${eventId}` : ''}`}
          className={`inline-block rounded px-4 py-2 font-semibold text-white ${isExpenses ? 'bg-red-600 hover:bg-red-700' : 'bg-green-700 hover:bg-green-800'}`}
        >
          {isExpenses ? '+ Add expense' : '+ Add income'}
        </Link>
      )}

      {/* Filters: stacked on phones, in a row on bigger screens */}
      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isExpenses ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <div>
          <label htmlFor={`${kind}-event`} className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select id={`${kind}-event`} value={eventId} onChange={(e) => updateParams({ event: e.target.value })} className={inputClass}>
            <option value="">All events</option>
            {events.data?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
        {isExpenses && (
          <div>
            <label htmlFor="expenses-category" className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select id="expenses-category" value={category} onChange={(e) => updateParams({ category: e.target.value })} className={inputClass}>
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor={`${kind}-from`} className="mb-1 block text-sm font-medium text-gray-700">
            From date
          </label>
          <input id={`${kind}-from`} type="date" value={from} max={to || undefined} onChange={(e) => updateParams({ from: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${kind}-to`} className="mb-1 block text-sm font-medium text-gray-700">
            To date
          </label>
          <input id={`${kind}-to`} type="date" value={to} min={from || undefined} onChange={(e) => updateParams({ to: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <p aria-live="polite">{pagination ? `${pagination.total} ${pagination.total === 1 ? noun : plural}` : ''}</p>
        {hasFilters && (
          <button type="button" onClick={() => updateParams({ event: '', category: '', from: '', to: '' })} className="font-semibold text-orange-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {shownMessage && (
        <p role="status" className="mt-3 rounded bg-green-50 px-3 py-2 text-green-700">
          {shownMessage}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">
          {actionError}
        </p>
      )}
      {list.error && (
        <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">
          {list.error}{' '}
          <button type="button" onClick={list.reload} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}
      {list.loading && (
        <p role="status" className="mt-4 text-gray-500">
          Loading {isExpenses ? 'expenses' : 'income'}...
        </p>
      )}
      {pagination?.total === 0 && <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">{emptyText}</div>}
      {pagination && pagination.total > 0 && rows.length === 0 && (
        <p className="mt-4 text-gray-600">There is nothing on this page. Use the buttons below to go back.</p>
      )}

      {rows.length > 0 && (
        <>
          {/* Phones: one card per record, so nothing needs sideways scrolling */}
          <ul className="mt-4 space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id} className="rounded-lg bg-white p-4 shadow">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-medium">{row.title}</p>
                  <p className={`whitespace-nowrap font-semibold ${isExpenses ? 'text-red-700' : 'text-green-700'}`}>{formatINR(row.amount)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {row.eventTitle} · {row.detail}
                </p>
                <p className="text-sm text-gray-500">{formatEventDate(row.date)}</p>
                {canEdit && <RowActions row={row} basePath={basePath} onDelete={setRowToDelete} />}
              </li>
            ))}
          </ul>

          {/* Tablets and computers: a table */}
          <div className="mt-4 hidden overflow-x-auto rounded-lg bg-white shadow md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">{isExpenses ? 'Expense' : 'Income'}</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">{isExpenses ? 'Category' : 'Source'}</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">{row.eventTitle}</td>
                    <td className="px-4 py-3">{row.detail}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{formatINR(row.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatEventDate(row.date)}</td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <RowActions row={row} basePath={basePath} onDelete={setRowToDelete} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => updateParams({ page: String(p) })} />}

      {/* Confirmation box: nothing is deleted until the admin confirms */}
      {rowToDelete && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 id="delete-title" className="text-lg font-semibold">
              Delete {noun}?
            </h2>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete "{rowToDelete.title}" ({formatINR(rowToDelete.amount)})? This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setRowToDelete(null)} disabled={deleting} className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RowActions({ row, basePath, onDelete }: { row: Row; basePath: string; onDelete: (row: Row) => void }) {
  return (
    <span className="mt-2 inline-flex gap-4 md:mt-0">
      <Link to={`${basePath}/${row.id}/edit`} className="text-orange-600 hover:underline" aria-label={`Edit ${row.title}`}>
        Edit
      </Link>
      <button type="button" onClick={() => onDelete(row)} className="text-red-600 hover:underline" aria-label={`Delete ${row.title}`}>
        Delete
      </button>
    </span>
  )
}

export default FinanceRecords
