import { Link, useSearchParams } from 'react-router'
import FinanceRecords from '../components/FinanceRecords'
import PageHeader from '../components/ui/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'

// TEAM_MEMBER and ADMIN: /team/finance — income and expenses, VIEW ONLY.
// There are no Add/Edit/Delete buttons, and the backend refuses changes from team members (403).
function TeamFinancePage() {
  usePageTitle('Finance')
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'income' ? 'income' : 'expenses'
  // Switching tabs keeps the chosen event
  const event = searchParams.get('event')
  const tabLink = (name: string) => `/team/finance?tab=${name}${event ? `&event=${event}` : ''}`

  const tabClass = (active: boolean) =>
    `-mb-px inline-flex min-h-11 items-center border-b-2 px-4 font-medium ${
      active ? 'border-primary text-primary-hover' : 'border-transparent text-muted hover:text-primary'
    }`

  return (
    <section>
      <PageHeader
        title="Finance"
        subtitle="View only. Only admins can add, edit or delete financial records."
        back={{ to: '/team/dashboard', label: 'Back to dashboard' }}
      />

      <nav aria-label="Finance views" className="mb-5 flex gap-2 border-b border-line">
        <Link to={tabLink('expenses')} aria-current={tab === 'expenses' ? 'page' : undefined} className={tabClass(tab === 'expenses')}>
          Expenses
        </Link>
        <Link to={tabLink('income')} aria-current={tab === 'income' ? 'page' : undefined} className={tabClass(tab === 'income')}>
          Income
        </Link>
      </nav>

      {/* key: switching tabs starts the list fresh */}
      <FinanceRecords key={tab} kind={tab} canEdit={false} basePath="/team/finance" />
    </section>
  )
}

export default TeamFinancePage
