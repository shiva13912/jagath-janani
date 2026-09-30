import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import FinancialSummary from '../components/FinancialSummary'
import RecentActivity from '../components/RecentActivity'
import { StatCardSkeleton } from '../components/StatCard'
import BalanceChart, { type BalanceBar } from '../components/charts/BalanceChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart'
import { useApiData } from '../hooks/useApiData'
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
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{isAdmin ? 'Admin Dashboard' : 'Team Dashboard'}</h1>
          <p className="mt-1 text-gray-600">
            {isAdmin ? 'Events, media and finances at a glance.' : 'Events, media and finances at a glance (view only).'}
          </p>
        </div>
        <div className="sm:w-72">
          <label htmlFor="dashboard-event" className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select
            id="dashboard-event"
            value={eventId}
            onChange={(e) => chooseEvent(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            <option value="">All events</option>
            {events.data?.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/admin/income/create${query}`} className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800">
            + Add income
          </Link>
          <Link to={`/admin/expenses/create${query}`} className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
            + Add expense
          </Link>
          <Link to={listPath.income} className="rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Manage income
          </Link>
          <Link to={listPath.expenses} className="rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Manage expenses
          </Link>
        </div>
      )}
      {!isAdmin && (
        <Link to="/team/finance" className="mt-4 inline-block rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
          View all income and expenses
        </Link>
      )}

      {noEvents && <p className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">No events available.</p>}

      {summary.error && (
        <div role="alert" className="mt-6 rounded bg-red-50 px-3 py-2 text-red-700">
          {summary.error === 'The requested item was not found.' ? 'This event was not found. Please choose another event.' : summary.error}{' '}
          <button type="button" onClick={summary.reload} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      <div className="mt-6" aria-busy={summary.loading}>
        {summary.loading && (
          <>
            <p role="status" className="sr-only">
              Loading dashboard...
            </p>
            <StatCardSkeleton count={8} />
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="h-80 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-80 animate-pulse rounded-lg bg-gray-200" />
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
        <p className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-gray-500">
          No financial data available for this event.
        </p>
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
        <p className="mt-2 text-sm text-gray-500">The charts show the 10 most recent events with financial records. Choose an event above to see any other event.</p>
      )}
    </>
  )
}

export default DashboardPage
