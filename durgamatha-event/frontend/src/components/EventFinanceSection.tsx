import { useCallback } from 'react'
import { useApiData } from '../hooks/useApiData'
import { getEventDashboardSummary } from '../services/financeService'
import { hasRole, ADMIN_ROLES } from '../utils/roles'
import type { Role } from '../types/auth'
import FinancialSummary from './FinancialSummary'
import { StatCardSkeleton } from './StatCard'
import { ButtonLink } from './ui/Button'
import { cardClass } from './ui/Card'
import { SectionTitle } from './ui/PageHeader'
import { ErrorState } from './ui/StateMessages'

// "Finance and media" section on the event page. The page only shows it to team members
// and admins; the backend also refuses these numbers to everyone else (401/403).
function EventFinanceSection({ eventId, role }: { eventId: string; role: Role }) {
  const load = useCallback(() => getEventDashboardSummary(eventId), [eventId])
  const { data, error, loading, reload } = useApiData(load)
  const dashboardPath = hasRole(role, ADMIN_ROLES) ? '/admin/dashboard' : '/team/dashboard'
  const hasMoney = data !== null && (Number(data.totalIncome) > 0 || Number(data.totalExpenses) > 0)

  return (
    <section className={`mt-8 p-5 sm:p-6 ${cardClass}`} aria-labelledby="event-finance-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle id="event-finance-heading">Finance and media</SectionTitle>
        <ButtonLink to={`${dashboardPath}?event=${eventId}`} variant="ghost" size="sm">
          Open in dashboard
        </ButtonLink>
      </div>
      <p className="text-sm text-muted">Only team members and admins can see this section.</p>

      <div className="mt-4">
        {loading && <StatCardSkeleton count={7} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <>
            <FinancialSummary summary={data} counts={data} />
            {!hasMoney && <p className="mt-3 text-muted">No financial data available for this event.</p>}
          </>
        )}
      </div>
    </section>
  )
}

export default EventFinanceSection
