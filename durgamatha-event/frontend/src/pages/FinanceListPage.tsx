import { useSearchParams } from 'react-router'
import FinanceRecords from '../components/FinanceRecords'
import { ButtonLink } from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import type { FinanceKind } from '../types/finance'

// ADMIN only: /admin/income and /admin/expenses
function FinanceListPage({ kind }: { kind: FinanceKind }) {
  const isExpenses = kind === 'expenses'
  const title = isExpenses ? 'Manage Expenses' : 'Manage Income'
  usePageTitle(title)
  // "+ Add" keeps the event chosen in the filter, so the form starts with it
  const eventId = useSearchParams()[0].get('event')

  return (
    <section>
      <PageHeader
        title={title}
        back={{ to: '/admin/dashboard', label: 'Back to dashboard' }}
        actions={<ButtonLink to={`/admin/${kind}/create${eventId ? `?event=${eventId}` : ''}`}>{isExpenses ? '+ Add expense' : '+ Add income'}</ButtonLink>}
      />
      <FinanceRecords kind={kind} canEdit basePath={`/admin/${kind}`} />
    </section>
  )
}

export default FinanceListPage
