import type { Pagination } from './media'

// Money always travels as exact text like "10000.50" (never rounded by JavaScript).
// It is turned into a number only for charts, and formatted as ₹10,000.50 for display.
export type Money = string

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

interface RecordLinks {
  event: { id: string; title: string } | null
  creator: { full_name: string } | null
}

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

// What the forms send. The event (from the URL), creator and dates are set by the backend.
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

// "income" or "expenses": which kind of record a shared page or component is showing
export type FinanceKind = 'income' | 'expenses'

export interface FinanceFilters {
  page: number
  limit?: number
  eventId: string
  category: string // expenses only; '' = all
  from: string // "YYYY-MM-DD" or ''
  to: string
}

export interface IncomePage {
  income: Income[]
  pagination: Pagination
}
export interface ExpensePage {
  expenses: Expense[]
  pagination: Pagination
}

export interface FinancialSummary {
  totalIncome: Money
  totalExpenses: Money
  remainingBalance: Money // calculated by the database: income - expenses
}

export interface CategoryTotal {
  category: ExpenseCategory
  total: Money
}

export interface EventFinance extends FinancialSummary {
  eventId: string
  eventTitle: string
}

export interface EventDashboardSummary extends EventFinance {
  totalAlbums: number
  totalPhotos: number
  totalVideos: number
  expensesByCategory: CategoryTotal[]
}

export interface DashboardStats extends FinancialSummary {
  totalEvents: number
  totalAlbums: number
  totalPhotos: number
  totalVideos: number
  expensesByCategory: CategoryTotal[]
  events: EventFinance[] // the 10 most recent events with financial records
}
