import { Link } from 'react-router'
import FinanceRecords from '../components/FinanceRecords'
import type { FinanceKind } from '../types/finance'

// ADMIN only: /admin/income and /admin/expenses
function FinanceListPage({ kind }: { kind: FinanceKind }) {
  return (
    <section className="mx-auto max-w-6xl">
      <Link to="/admin/dashboard" className="text-orange-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{kind === 'expenses' ? 'Manage Expenses' : 'Manage Income'}</h1>
      <div className="mt-4">
        <FinanceRecords kind={kind} canEdit basePath={`/admin/${kind}`} />
      </div>
    </section>
  )
}

export default FinanceListPage
