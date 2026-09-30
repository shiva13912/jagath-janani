import { Link, useSearchParams } from 'react-router'
import FinanceRecords from '../components/FinanceRecords'

// TEAM_MEMBER and ADMIN: /team/finance — income and expenses, VIEW ONLY.
// There are no Add/Edit/Delete buttons, and the backend refuses changes from team members (403).
function TeamFinancePage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'income' ? 'income' : 'expenses'
  // Switching tabs keeps the chosen event
  const event = searchParams.get('event')
  const tabLink = (name: string) => `/team/finance?tab=${name}${event ? `&event=${event}` : ''}`

  const tabClass = (active: boolean) =>
    `rounded-t px-4 py-2 font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${
      active ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-600 hover:text-orange-600'
    }`

  return (
    <section className="mx-auto max-w-6xl">
      <Link to="/team/dashboard" className="text-orange-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Finance</h1>
      <p className="mt-1 text-gray-600">View only. Only admins can add, edit or delete financial records.</p>

      <nav aria-label="Finance views" className="mt-6 flex gap-2 border-b border-gray-200">
        <Link to={tabLink('expenses')} aria-current={tab === 'expenses' ? 'page' : undefined} className={tabClass(tab === 'expenses')}>
          Expenses
        </Link>
        <Link to={tabLink('income')} aria-current={tab === 'income' ? 'page' : undefined} className={tabClass(tab === 'income')}>
          Income
        </Link>
      </nav>

      <div className="mt-4">
        {/* key: switching tabs starts the list fresh */}
        <FinanceRecords key={tab} kind={tab} canEdit={false} basePath="/team/finance" />
      </div>
    </section>
  )
}

export default TeamFinancePage
