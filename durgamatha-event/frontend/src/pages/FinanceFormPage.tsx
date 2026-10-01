import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import Alert from '../components/ui/Alert'
import Button, { ButtonLink } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { FormActions, InputField, ReadOnlyField, SelectField, TextareaField } from '../components/ui/Field'
import PageHeader from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { usePageTitle } from '../hooks/usePageTitle'
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
  usePageTitle(heading)

  const events = useApiData(getEvents)

  // Edit: load the record once. Create: nothing to load.
  const loadRecord = useCallback(async (): Promise<Income | Expense | null> => {
    if (mode === 'create') return null
    return isExpenses ? getExpense(id) : getIncome(id)
  }, [mode, isExpenses, id])
  const record = useApiData(loadRecord)

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={heading} back={{ to: listPath, label: `Back to ${isExpenses ? 'expenses' : 'income'}` }} />
      {record.loading && <LoadingState />}
      {record.error && (
        <ErrorState
          message={record.error === 'The requested item was not found.' ? `This ${isExpenses ? 'expense' : 'income record'} was not found.` : record.error}
        />
      )}
      {!record.loading && !record.error && (
        <Card>
          <FinanceForm
            key={record.data?.id ?? 'new'}
            kind={kind}
            record={record.data}
            initialEventId={searchParams.get('event') ?? ''}
            events={events.data ?? []}
            eventsLoading={events.loading}
            listPath={listPath}
          />
        </Card>
      )}
    </div>
  )
}

// The id of each field, used to put the cursor in the field that needs fixing
const fieldIdsBase = { eventId: 'finance-event', title: 'finance-title', amount: 'finance-amount', date: 'finance-date', description: 'finance-description' }

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
  const fieldIds: Record<keyof FormValues, string> = { ...fieldIdsBase, detail: isExpenses ? 'finance-category' : 'finance-source' }
  const [values, setValues] = useState<FormValues>(() => initialValues(record, initialEventId))
  const [error, setError] = useState('')
  const [badField, setBadField] = useState<keyof FormValues | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  // A quick check for friendly messages; the backend checks everything again
  function validate(): { field: keyof FormValues; message: string } | null {
    if (!record && !values.eventId) return { field: 'eventId', message: 'Please choose an event.' }
    if (!values.title.trim()) return { field: 'title', message: 'Please enter a title.' }
    if (!values.amount.trim()) return { field: 'amount', message: 'Please enter an amount.' }
    if (!isValidAmount(values.amount))
      return { field: 'amount', message: 'The amount must be more than 0, with at most 2 decimal places (for example 1500 or 1500.50).' }
    if (!values.detail.trim())
      return { field: 'detail', message: isExpenses ? 'Please choose a category.' : 'Please enter the source (for example Donation or Sponsor).' }
    if (!values.date) return { field: 'date', message: 'Please choose a date.' }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBadField(null)
    const problem = validate()
    if (problem) {
      setError(problem.message)
      setBadField(problem.field)
      document.getElementById(fieldIds[problem.field])?.focus() // the cursor goes to the field to fix
      return
    }

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
    navigate(listPath, { state: { success: `${what} ${record ? 'updated' : 'added'} successfully. ("${common.title}", ${formatINR(common.amount)})` } })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {record ? (
        <ReadOnlyField label="Event" value={record.event?.title ?? '—'} hint="The event of a record cannot be changed." />
      ) : (
        <SelectField
          id={fieldIds.eventId}
          label="Event"
          value={values.eventId}
          invalid={badField === 'eventId'}
          onChange={(e) => setField('eventId', e.target.value)}
          disabled={eventsLoading}
          hint={!eventsLoading && events.length === 0 ? 'No events available. Create an event first.' : undefined}
        >
          <option value="">{eventsLoading ? 'Loading events...' : 'Choose an event'}</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </SelectField>
      )}

      <InputField id={fieldIds.title} label="Title" maxLength={150} value={values.title} invalid={badField === 'title'} onChange={(e) => setField('title', e.target.value)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id={fieldIds.amount}
          label="Amount (₹)"
          inputMode="decimal"
          placeholder="e.g. 1500.50"
          value={values.amount}
          invalid={badField === 'amount'}
          onChange={(e) => setField('amount', e.target.value)}
        />
        <InputField
          id={fieldIds.date}
          label={isExpenses ? 'Date spent' : 'Date received'}
          type="date"
          value={values.date}
          invalid={badField === 'date'}
          onChange={(e) => setField('date', e.target.value)}
        />
      </div>

      {isExpenses ? (
        <SelectField id="finance-category" label="Category" value={values.detail} invalid={badField === 'detail'} onChange={(e) => setField('detail', e.target.value)}>
          <option value="">Choose a category</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
      ) : (
        <InputField
          id="finance-source"
          label="Source (e.g. Donation, Sponsor)"
          maxLength={100}
          value={values.detail}
          invalid={badField === 'detail'}
          onChange={(e) => setField('detail', e.target.value)}
        />
      )}

      <TextareaField
        id="finance-description"
        label="Description"
        optional
        rows={3}
        maxLength={2000}
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <FormActions>
        <Button type="submit" loading={submitting} loadingText="Saving...">
          {record ? 'Save Changes' : isExpenses ? 'Add Expense' : 'Add Income'}
        </Button>
        <ButtonLink to={listPath} variant="secondary">
          Cancel
        </ButtonLink>
      </FormActions>
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
