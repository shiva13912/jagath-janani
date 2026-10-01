import type { Pagination } from './media'

// Money is always sent and stored as TEXT like "10000.50", never as a JavaScript number,
// so no amount is ever changed by floating-point rounding. PostgreSQL stores it as numeric(12,2).
export type Money = string

// The fixed list of expense categories (the same list is checked by the database)
export const EXPENSE_CATEGORIES = [
  'Food',
  'Decoration',
  'Transportation',
  'Equipment',
  'Venue',
  'Printing',
  'Sound & Lighting',
  'Gifts',
  'Maintenance',
  'Other',
] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// The event and creator names shown next to each record in the tables
interface RecordLinks {
  event: { id: string; title: string } | null
  creator: { full_name: string } | null
}

// An income row, as returned by the API
export interface Income extends RecordLinks {
  id: string
  event_id: string
  title: string
  description: string | null
  amount: Money
  source: string
  received_date: string // "YYYY-MM-DD"
  created_by: string
  created_at: string
  updated_at: string
}

// An expense row, as returned by the API
export interface Expense extends RecordLinks {
  id: string
  event_id: string
  title: string
  description: string | null
  amount: Money
  category: ExpenseCategory
  spent_date: string // "YYYY-MM-DD"
  created_by: string
  created_at: string
  updated_at: string
}

// The only fields a client may send. event_id comes from the URL on create and can't be
// changed on update; created_by always comes from the logged-in user.
export interface CreateIncomeRequest {
  title: string
  description: string | null
  amount: Money
  source: string
  received_date: string
}
export type UpdateIncomeRequest = CreateIncomeRequest

export interface CreateExpenseRequest {
  title: string
  description: string | null
  amount: Money
  category: ExpenseCategory
  spent_date: string
}
export type UpdateExpenseRequest = CreateExpenseRequest

// Filters for GET /api/income and GET /api/expenses
export interface FinanceQuery {
  page: number
  limit: number
  eventId: string | null
  category: ExpenseCategory | null // expenses only
  from: string | null // "YYYY-MM-DD", inclusive
  to: string | null
}

export interface FinanceList<T> {
  records: T[]
  total: number
}
export type { Pagination }

// GET /api/events/:eventId/financial-summary
export interface FinancialSummary {
  totalIncome: Money
  totalExpenses: Money
  remainingBalance: Money // always calculated: income - expenses (never stored)
}

export interface CategoryTotal {
  category: ExpenseCategory
  total: Money
}

export interface EventFinance extends FinancialSummary {
  eventId: string
  eventTitle: string
}

// GET /api/events/:eventId/dashboard-summary
export interface EventDashboardSummary extends EventFinance {
  totalAlbums: number
  totalPhotos: number
  totalVideos: number
  expensesByCategory: CategoryTotal[]
}

// GET /api/dashboard/summary
export interface DashboardStats extends FinancialSummary {
  totalEvents: number
  totalAlbums: number
  totalPhotos: number
  totalVideos: number
  expensesByCategory: CategoryTotal[]
  events: EventFinance[] // the 10 most recent events with financial records, for the charts
}
