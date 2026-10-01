import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import FinancialSummary from '../components/FinancialSummary'
import RecentActivity from '../components/RecentActivity'
import { StatCardSkeleton } from '../components/StatCard'
import BalanceChart, { type BalanceBar } from '../components/charts/BalanceChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart'
import { ButtonLink } from '../components/ui/Button'
import { SelectField } from '../components/ui/Field'
import PageHeader from '../components/ui/PageHeader'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { usePageTitle } from '../hooks/usePageTitle'
import { getEvents } from '../services/eventService'
import { getDashboardSummary, getEventDashboardSummary } from '../services/financeService'
import type { DashboardStats, EventDashboardSummary } from '../types/finance'

interface DashboardPageProps {
  area: 'admin' | 'team' // admins also get the "Add" and "Manage" buttons
}

// /admin/dashboard and /team/dashboard. Every number comes from the database:
//   All events   -> GET /api/dashboard/summary (one request)
//   One event    -> GET /api/events/:id/dashboard-summary (only that event's numbers)
// The chosen event is kept in the URL (?event=...), so a refresh or Back keeps it.
function DashboardPage({ area }: DashboardPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const isAdmin = area === 'admin'
  usePageTitle(isAdmin ? 'Admin Dashboard' : 'Team Dashboard')

  const events = useApiData(getEvents)

  const loadSummary = useCallback(
    (): Promise<DashboardStats | EventDashboardSummary> => (eventId ? getEventDashboardSummary(eventId) : getDashboardSummary()),
    [eventId],
  )
  const summary = useApiData(loadSummary)

  function chooseEvent(id: string) {
    setSearchParams(id ? { event: id } : {})
  }

  const query = eventId ? `?event=${eventId}` : ''
  const listPath = isAdmin
    ? { income: `/admin/income${query}`, expenses: `/admin/expenses${query}` }
    : { income: `/team/finance?tab=income${eventId ? `&event=${eventId}` : ''}`, expenses: `/team/finance?tab=expenses${eventId ? `&event=${eventId}` : ''}` }

  const noEvents = events.data !== null && events.data.length === 0

  return (
    <section>
      <PageHeader
        title={isAdmin ? 'Admin Dashboard' : 'Team Dashboard'}
        subtitle={isAdmin ? 'Events, media and finances at a glance.' : 'Events, media and finances at a glance (view only).'}
        actions={
          <div className="w-full sm:w-72">
            <SelectField id="dashboard-event" label="Event" value={eventId} onChange={(e) => chooseEvent(e.target.value)}>
              <option value="">All events</option>
              {events.data?.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </SelectField>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {isAdmin ? (
          <>
            <ButtonLink to={`/admin/income/create${query}`}>+ Add income</ButtonLink>
            <ButtonLink to={`/admin/expenses/create${query}`}>+ Add expense</ButtonLink>
            <ButtonLink to={listPath.income} variant="secondary">
              Manage income
            </ButtonLink>
            <ButtonLink to={listPath.expenses} variant="secondary">
              Manage expenses
            </ButtonLink>
          </>
        ) : (
          <ButtonLink to="/team/finance" variant="secondary">
            View all income and expenses
          </ButtonLink>
        )}
      </div>

      {noEvents && <EmptyState message="No events available." className="mt-6" />}

      {summary.error && (
        <ErrorState
          className="mt-6"
          message={summary.error === 'The requested item was not found.' ? 'This event was not found. Please choose another event.' : summary.error}
          onRetry={summary.reload}
        />
      )}

      <div className="mt-6" aria-busy={summary.loading}>
        {summary.loading && (
          <>
            <p role="status" className="sr-only">
              Loading dashboard...
            </p>
            <StatCardSkeleton count={8} />
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-80 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </>
        )}
        {summary.data && <DashboardContent summary={summary.data} />}
      </div>

      <RecentActivity eventId={eventId} listPath={listPath} />
    </section>
  )
}

function isEventSummary(summary: DashboardStats | EventDashboardSummary): summary is EventDashboardSummary {
  return 'eventId' in summary
}

// The cards and the three charts, for all events or for one event
function DashboardContent({ summary }: { summary: DashboardStats | EventDashboardSummary }) {
  const single = isEventSummary(summary)

  // Income vs Expenses: one pair of bars per event (or just the chosen event)
  const chartEvents = single ? [summary] : summary.events

  // Balance: per event, or Income / Expenses / Balance of the chosen event
  const balanceBars: BalanceBar[] = single
    ? [
        { name: 'Income', value: Number(summary.totalIncome), kind: 'income' },
        { name: 'Expenses', value: Number(summary.totalExpenses), kind: 'expenses' },
        { name: 'Balance', value: Number(summary.remainingBalance), kind: 'balance' },
      ]
    : summary.events.map((event) => ({ name: event.eventTitle, value: Number(event.remainingBalance), kind: 'balance' }))

  const hasMoney = Number(summary.totalIncome) > 0 || Number(summary.totalExpenses) > 0

  return (
    <>
      <FinancialSummary
        summary={summary}
        counts={{
          totalEvents: single ? undefined : summary.totalEvents,
          totalAlbums: summary.totalAlbums,
          totalPhotos: summary.totalPhotos,
          totalVideos: summary.totalVideos,
        }}
      />

      {single && !hasMoney && (
        <EmptyState message="No financial data available for this event." className="mt-6" />
      )}

      {(!single || hasMoney) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <IncomeExpenseChart events={chartEvents} />
          <CategoryPieChart categories={summary.expensesByCategory} />
          <div className="lg:col-span-2">
            <BalanceChart bars={balanceBars} />
          </div>
        </div>
      )}
      {!single && summary.events.length === 10 && (
        <p className="mt-2 text-sm text-muted">The charts show the 10 most recent events with financial records. Choose an event above to see any other event.</p>
      )}
    </>
  )
}

export default DashboardPage
