import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import FormField from '../components/FormField'
import { useApiData } from '../hooks/useApiData'
import { getEvents } from '../services/eventService'
import { createExpense, createIncome, getExpense, getIncome, updateExpense, updateIncome } from '../services/financeService'
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type FinanceKind, type Income } from '../types/finance'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { todayString } from '../utils/date'
import { formatINR, isValidAmount } from '../utils/money'

interface FormValues {
  eventId: string
  title: string
  description: string
  amount: string // kept as text so "1500.50" is sent exactly as typed
  detail: string // expense category or income source
  date: string
}

const inputClass = 'w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none'

// ADMIN only:
//   /admin/income/create      /admin/income/:id/edit
//   /admin/expenses/create    /admin/expenses/:id/edit
// When editing, the event cannot be changed (and the backend ignores it anyway),
// and the creator and created date are never part of the form.
function FinanceFormPage({ kind, mode }: { kind: FinanceKind; mode: 'create' | 'edit' }) {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const isExpenses = kind === 'expenses'
  const listPath = `/admin/${kind}`
  const heading = `${mode === 'create' ? 'Add' : 'Edit'} ${isExpenses ? 'Expense' : 'Income'}`

  const events = useApiData(getEvents)

  // Edit: load the record once. Create: nothing to load.
  const loadRecord = useCallback(async (): Promise<Income | Expense | null> => {
    if (mode === 'create') return null
    return isExpenses ? getExpense(id) : getIncome(id)
  }, [mode, isExpenses, id])
  const record = useApiData(loadRecord)

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">{heading}</h1>

      {record.loading && <p className="text-gray-500">Loading...</p>}
      {record.error && (
        <div>
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-red-700">
            {record.error === 'The requested item was not found.' ? `This ${isExpenses ? 'expense' : 'income record'} was not found.` : record.error}
          </p>
          <Link to={listPath} className="mt-4 inline-block text-orange-600 hover:underline">
            ← Back to {isExpenses ? 'expenses' : 'income'}
          </Link>
        </div>
      )}
      {!record.loading && !record.error && (
        <FinanceForm
          key={record.data?.id ?? 'new'}
          kind={kind}
          record={record.data}
          initialEventId={searchParams.get('event') ?? ''}
          events={events.data ?? []}
          eventsLoading={events.loading}
          listPath={listPath}
        />
      )}
    </section>
  )
}

interface FinanceFormProps {
  kind: FinanceKind
  record: Income | Expense | null // null = create
  initialEventId: string
  events: { id: string; title: string }[]
  eventsLoading: boolean
  listPath: string
}

function FinanceForm({ kind, record, initialEventId, events, eventsLoading, listPath }: FinanceFormProps) {
  const navigate = useNavigate()
  const isExpenses = kind === 'expenses'
  const [values, setValues] = useState<FormValues>(() => initialValues(record, initialEventId))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  // A quick check for friendly messages; the backend checks everything again
  function validate(): string {
    if (!record && !values.eventId) return 'Please choose an event.'
    if (!values.title.trim()) return 'Please enter a title.'
    if (!values.amount.trim()) return 'Please enter an amount.'
    if (!isValidAmount(values.amount)) return 'The amount must be more than 0, with at most 2 decimal places (for example 1500 or 1500.50).'
    if (!values.detail.trim()) return isExpenses ? 'Please choose a category.' : 'Please enter the source (for example Donation or Sponsor).'
    if (!values.date) return 'Please choose a date.'
    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const problem = validate()
    if (problem) return setError(problem)

    const common = { title: values.title.trim(), description: values.description.trim() || null, amount: values.amount.trim() }
    setSubmitting(true)
    try {
      if (isExpenses) {
        const data = { ...common, category: values.detail as ExpenseCategory, spent_date: values.date }
        if (record) await updateExpense(record.id, data)
        else await createExpense(values.eventId, data)
      } else {
        const data = { ...common, source: values.detail.trim(), received_date: values.date }
        if (record) await updateIncome(record.id, data)
        else await createIncome(values.eventId, data)
      }
    } catch (err) {
      setError(isNotFoundError(err) && !record ? 'This event no longer exists. Please choose another event.' : getErrorMessage(err))
      setSubmitting(false)
      return
    }
    const what = isExpenses ? 'Expense' : 'Income'
    navigate(listPath, { state: { message: `${what} "${common.title}" (${formatINR(common.amount)}) was ${record ? 'updated' : 'added'}.` } })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {record ? (
        <div>
          <p className="mb-1 block text-sm font-medium text-gray-700">Event</p>
          <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">{record.event?.title ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-500">The event of a record cannot be changed.</p>
        </div>
      ) : (
        <div>
          <label htmlFor="finance-event" className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select id="finance-event" value={values.eventId} onChange={(e) => setField('eventId', e.target.value)} className={inputClass} disabled={eventsLoading}>
            <option value="">{eventsLoading ? 'Loading events...' : 'Choose an event'}</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
          {!eventsLoading && events.length === 0 && <p className="mt-1 text-sm text-gray-500">No events available. Create an event first.</p>}
        </div>
      )}

      <FormField id="finance-title" label="Title" maxLength={150} value={values.title} onChange={(e) => setField('title', e.target.value)} />

      <div>
        <label htmlFor="finance-amount" className="mb-1 block text-sm font-medium text-gray-700">
          Amount (₹)
        </label>
        <input
          id="finance-amount"
          inputMode="decimal"
          placeholder="e.g. 1500.50"
          value={values.amount}
          onChange={(e) => setField('amount', e.target.value)}
          className={inputClass}
        />
      </div>

      {isExpenses ? (
        <div>
          <label htmlFor="finance-category" className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select id="finance-category" value={values.detail} onChange={(e) => setField('detail', e.target.value)} className={inputClass}>
            <option value="">Choose a category</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <FormField id="finance-source" label="Source (e.g. Donation, Sponsor)" maxLength={100} value={values.detail} onChange={(e) => setField('detail', e.target.value)} />
      )}

      <FormField
        id="finance-date"
        label={isExpenses ? 'Date spent' : 'Date received'}
        type="date"
        value={values.date}
        onChange={(e) => setField('date', e.target.value)}
      />

      <div>
        <label htmlFor="finance-description" className="mb-1 block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea id="finance-description" rows={3} maxLength={2000} value={values.description} onChange={(e) => setField('description', e.target.value)} className={inputClass} />
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={submitting} className="rounded bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
          {submitting ? 'Saving...' : record ? 'Save Changes' : isExpenses ? 'Add Expense' : 'Add Income'}
        </button>
        <Link to={listPath} className="rounded border border-gray-300 px-5 py-2 text-center text-gray-700 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  )
}

function initialValues(record: Income | Expense | null, eventId: string): FormValues {
  if (!record) return { eventId, title: '', description: '', amount: '', detail: '', date: todayString() }
  return {
    eventId: record.event_id,
    title: record.title,
    description: record.description ?? '',
    amount: record.amount,
    detail: 'category' in record ? record.category : record.source,
    date: 'spent_date' in record ? record.spent_date : record.received_date,
  }
}

export default FinanceFormPage
