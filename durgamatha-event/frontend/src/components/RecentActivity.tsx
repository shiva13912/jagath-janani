import { useCallback } from 'react'
import { useApiData } from '../hooks/useApiData'
import { getExpensePage, getIncomePage } from '../services/financeService'
import { formatEventDate } from '../utils/date'
import { formatINR } from '../utils/money'
import { ButtonLink } from './ui/Button'
import { cardClass } from './ui/Card'
import { SectionTitle } from './ui/PageHeader'
import { ErrorState } from './ui/StateMessages'

const RECENT_COUNT = 5

interface ActivityItem {
  id: string
  title: string
  eventTitle: string
  amount: string
  date: string
  detail: string // category or source
}

// The latest income and expenses, straight from the database (5 of each).
// With an eventId, only that event's records.
function RecentActivity({ eventId, listPath }: { eventId: string; listPath: { income: string; expenses: string } }) {
  const load = useCallback(() => {
    const filters = { page: 1, limit: RECENT_COUNT, eventId, category: '', from: '', to: '' }
    return Promise.all([getIncomePage(filters), getExpensePage(filters)])
  }, [eventId])
  const { data, error, loading, reload } = useApiData(load)

  const income: ActivityItem[] = (data?.[0].income ?? []).map((r) => ({
    id: r.id, title: r.title, eventTitle: r.event?.title ?? '', amount: r.amount, date: r.received_date, detail: r.source,
  }))
  const expenses: ActivityItem[] = (data?.[1].expenses ?? []).map((r) => ({
    id: r.id, title: r.title, eventTitle: r.event?.title ?? '', amount: r.amount, date: r.spent_date, detail: r.category,
  }))

  return (
    <section className="mt-10" aria-labelledby="recent-heading">
      <SectionTitle id="recent-heading">Recent activity</SectionTitle>
      {error && <ErrorState message={error} onRetry={reload} className="mt-3" />}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <ActivityList title="Recent expenses" items={expenses} loading={loading} error={!!error} emptyText="No expenses recorded yet." sign="-" tone="text-danger" allPath={listPath.expenses} />
        <ActivityList title="Recent income" items={income} loading={loading} error={!!error} emptyText="No income records yet." sign="+" tone="text-success" allPath={listPath.income} />
      </div>
    </section>
  )
}

interface ActivityListProps {
  title: string
  items: ActivityItem[]
  loading: boolean
  error: boolean
  emptyText: string
  sign: string
  tone: string
  allPath: string
}

function ActivityList({ title, items, loading, error, emptyText, sign, tone, allPath }: ActivityListProps) {
  return (
    // min-w-0 lets long titles shorten with "…" instead of widening the page on phones
    <div className={`min-w-0 p-4 ${cardClass}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-ink">{title}</h3>
        <ButtonLink to={allPath} variant="ghost" size="sm" aria-label={`View all ${title.replace('Recent ', '')}`}>
          View all
        </ButtonLink>
      </div>
      {loading && (
        <p role="status" className="mt-3 text-sm text-muted">
          Loading...
        </p>
      )}
      {!loading && !error && items.length === 0 && <p className="mt-3 text-sm text-muted">{emptyText}</p>}
      {items.length > 0 && (
        <ul className="mt-2 divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{item.title}</p>
                <p className="truncate text-sm text-muted">
                  {item.eventTitle} · {item.detail} · {formatEventDate(item.date)}
                </p>
              </div>
              <p className={`whitespace-nowrap font-semibold ${tone}`}>
                {sign}
                {formatINR(item.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentActivity
