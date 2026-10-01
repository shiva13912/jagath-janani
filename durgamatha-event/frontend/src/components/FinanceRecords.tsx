import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useApiData } from '../hooks/useApiData'
import { useFlashMessage } from '../hooks/useFlashMessage'
import { getEvents } from '../services/eventService'
import { deleteExpense, deleteIncome, getExpensePage, getIncomePage } from '../services/financeService'
import { EXPENSE_CATEGORIES, type FinanceKind } from '../types/finance'
import type { Pagination as PaginationInfo } from '../types/media'
import { getErrorMessage } from '../utils/apiError'
import { formatEventDate } from '../utils/date'
import { formatINR } from '../utils/money'
import Pagination from './Pagination'
import Alert from './ui/Alert'
import Button, { ButtonLink } from './ui/Button'
import ConfirmDialog from './ui/ConfirmDialog'
import { InputField, SelectField } from './ui/Field'
import ResponsiveTable, { SkeletonTable } from './ui/ResponsiveTable'
import { EmptyState, ErrorState } from './ui/StateMessages'

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
  canEdit: boolean // false for team members: no Edit/Delete (and the backend refuses anyway)
  basePath: string // e.g. "/admin/expenses", used for the Edit links
}

// The income or expenses list with filters (event, category, dates), pages and actions.
// Used by /admin/income, /admin/expenses and the read-only /team/finance.
// Filters live in the URL, so a refresh, Back or a shared link keeps them.
function FinanceRecords({ kind, canEdit, basePath }: FinanceRecordsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const isExpenses = kind === 'expenses'
  const noun = isExpenses ? 'expense' : 'income record'
  const plural = isExpenses ? 'expenses' : 'income records'

  const eventId = searchParams.get('event') ?? ''
  const category = isExpenses ? (searchParams.get('category') ?? '') : ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const hasFilters = Boolean(eventId || category || from || to)

  // After saving, the form passes a message such as "Expense added successfully."
  const [message, setMessage] = useFlashMessage()
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
    )
  }

  async function confirmDelete() {
    if (!rowToDelete) return
    setDeleting(true)
    setActionError('')
    try {
      if (isExpenses) await deleteExpense(rowToDelete.id)
      else await deleteIncome(rowToDelete.id)
      setMessage(`${isExpenses ? 'Expense' : 'Income'} deleted successfully. ("${rowToDelete.title}", ${formatINR(rowToDelete.amount)})`)
      list.reload() // load the list again from the database
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setRowToDelete(null)
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
  const amountClass = `font-semibold whitespace-nowrap ${isExpenses ? 'text-danger' : 'text-success'}`

  return (
    <div>
      {/* Filters: stacked on phones, in a row on bigger screens */}
      <div className={`grid gap-3 sm:grid-cols-2 ${isExpenses ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <SelectField id={`${kind}-event`} label="Event" value={eventId} onChange={(e) => updateParams({ event: e.target.value })}>
          <option value="">All events</option>
          {events.data?.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </SelectField>
        {isExpenses && (
          <SelectField id="expenses-category" label="Category" value={category} onChange={(e) => updateParams({ category: e.target.value })}>
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        )}
        <InputField id={`${kind}-from`} label="From date" type="date" value={from} max={to || undefined} onChange={(e) => updateParams({ from: e.target.value })} />
        <InputField id={`${kind}-to`} label="To date" type="date" value={to} min={from || undefined} onChange={(e) => updateParams({ to: e.target.value })} />
      </div>

      <div className="mt-3 flex min-h-10 flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <p aria-live="polite">{pagination ? `${pagination.total} ${pagination.total === 1 ? noun : plural}` : ''}</p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => updateParams({ event: '', category: '', from: '', to: '' })}>
            Clear filters
          </Button>
        )}
      </div>

      {message && (
        <Alert tone="success" className="mt-3">
          {message}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mt-3">
          {actionError}
        </Alert>
      )}

      <div className="mt-4">
        {list.loading && <SkeletonTable label={`Loading ${isExpenses ? 'expenses' : 'income'}...`} />}
        {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
        {pagination?.total === 0 && <EmptyState message={emptyText} />}
        {pagination && pagination.total > 0 && rows.length === 0 && (
          <p className="text-muted">There is nothing on this page. Use the buttons below to go back.</p>
        )}

        {rows.length > 0 && (
          <ResponsiveTable
            caption={isExpenses ? 'Expenses' : 'Income'}
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { header: isExpenses ? 'Expense' : 'Income', cell: (row) => row.title },
              { header: 'Amount', cell: (row) => <span className={amountClass}>{formatINR(row.amount)}</span>, align: 'right' },
              { header: 'Event', cell: (row) => row.eventTitle },
              { header: isExpenses ? 'Category' : 'Source', cell: (row) => row.detail },
              { header: 'Date', cell: (row) => <span className="whitespace-nowrap">{formatEventDate(row.date)}</span> },
            ]}
            actions={
              canEdit
                ? (row) => (
                    <>
                      <ButtonLink to={`${basePath}/${row.id}/edit`} variant="secondary" size="sm" aria-label={`Edit ${row.title}`}>
                        Edit
                      </ButtonLink>
                      <Button variant="danger" size="sm" onClick={() => setRowToDelete(row)} aria-label={`Delete ${row.title}`}>
                        Delete
                      </Button>
                    </>
                  )
                : undefined
            }
          />
        )}
      </div>

      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => updateParams({ page: String(p) })} />}

      {/* Confirmation box: nothing is deleted until the admin confirms */}
      {rowToDelete && (
        <ConfirmDialog
          title={`Delete ${noun}?`}
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setRowToDelete(null)}
        >
          <p>
            Are you sure you want to delete "{rowToDelete.title}" ({formatINR(rowToDelete.amount)})? This cannot be undone.
          </p>
        </ConfirmDialog>
      )}
    </div>
  )
}

export default FinanceRecords
