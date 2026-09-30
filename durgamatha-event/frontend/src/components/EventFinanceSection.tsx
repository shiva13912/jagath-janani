import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApiData } from '../hooks/useApiData'
import { getEventDashboardSummary } from '../services/financeService'
import { hasRole, ADMIN_ROLES } from '../utils/roles'
import type { Role } from '../types/auth'
import FinancialSummary from './FinancialSummary'
import { StatCardSkeleton } from './StatCard'

// "Finance and media" section on the event page. The page only shows it to team members
// and admins; the backend also refuses these numbers to everyone else (401/403).
function EventFinanceSection({ eventId, role }: { eventId: string; role: Role }) {
  const load = useCallback(() => getEventDashboardSummary(eventId), [eventId])
  const { data, error, loading, reload } = useApiData(load)
  const dashboardPath = hasRole(role, ADMIN_ROLES) ? '/admin/dashboard' : '/team/dashboard'
  const hasMoney = data !== null && (Number(data.totalIncome) > 0 || Number(data.totalExpenses) > 0)

  return (
    <section className="mt-8" aria-labelledby="event-finance-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="event-finance-heading" className="text-xl font-semibold">
          Finance and media
        </h2>
        <Link to={`${dashboardPath}?event=${eventId}`} className="text-sm font-medium text-orange-600 hover:underline">
          Open in dashboard
        </Link>
      </div>
      <p className="text-sm text-gray-500">Only team members and admins can see this section.</p>

      <div className="mt-3">
        {loading && <StatCardSkeleton count={7} />}
        {error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-red-700">
            {error}{' '}
            <button type="button" onClick={reload} className="font-semibold underline">
              Try again
            </button>
          </p>
        )}
        {data && (
          <>
            <FinancialSummary summary={data} counts={data} />
            {!hasMoney && <p className="mt-3 text-gray-500">No financial data available for this event.</p>}
          </>
        )}
      </div>
    </section>
  )
}

export default EventFinanceSection
