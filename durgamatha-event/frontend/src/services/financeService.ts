import type {
  CreateExpenseRequest,
  CreateIncomeRequest,
  DashboardStats,
  EventDashboardSummary,
  Expense,
  ExpensePage,
  FinanceFilters,
  FinancialSummary,
  Income,
  IncomePage,
  UpdateExpenseRequest,
  UpdateIncomeRequest,
} from '../types/finance'
import api from './api'

// All finance and dashboard API calls. The logged-in user's token is added by api.ts.
// The backend decides who may do what: team members can only read, admins can change.

// Empty filters are left out of the URL
function filterParams(filters: FinanceFilters) {
  return {
    page: filters.page,
    ...(filters.limit ? { limit: filters.limit } : {}),
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  }
}

// ---------- Dashboard ----------

export async function getDashboardSummary(): Promise<DashboardStats> {
  const response = await api.get<{ success: boolean; summary: DashboardStats }>('/dashboard/summary')
  return response.data.summary
}

export async function getEventDashboardSummary(eventId: string): Promise<EventDashboardSummary> {
  const response = await api.get<{ success: boolean; summary: EventDashboardSummary }>(
    `/events/${encodeURIComponent(eventId)}/dashboard-summary`,
  )
  return response.data.summary
}

export async function getEventFinancialSummary(eventId: string): Promise<FinancialSummary> {
  const response = await api.get<{ success: boolean; summary: FinancialSummary }>(
    `/events/${encodeURIComponent(eventId)}/financial-summary`,
  )
  return response.data.summary
}

// ---------- Income ----------

export async function getIncomePage(filters: FinanceFilters): Promise<IncomePage> {
  const response = await api.get<{ success: boolean } & IncomePage>('/income', { params: filterParams(filters) })
  return { income: response.data.income, pagination: response.data.pagination }
}

export async function getIncome(id: string): Promise<Income> {
  const response = await api.get<{ success: boolean; income: Income }>(`/income/${encodeURIComponent(id)}`)
  return response.data.income
}

export async function createIncome(eventId: string, data: CreateIncomeRequest): Promise<Income> {
  const response = await api.post<{ success: boolean; income: Income }>(`/events/${encodeURIComponent(eventId)}/income`, data)
  return response.data.income
}

export async function updateIncome(id: string, data: UpdateIncomeRequest): Promise<Income> {
  const response = await api.put<{ success: boolean; income: Income }>(`/income/${encodeURIComponent(id)}`, data)
  return response.data.income
}

export async function deleteIncome(id: string): Promise<void> {
  await api.delete(`/income/${encodeURIComponent(id)}`)
}

// ---------- Expenses ----------

export async function getExpensePage(filters: FinanceFilters): Promise<ExpensePage> {
  const response = await api.get<{ success: boolean } & ExpensePage>('/expenses', { params: filterParams(filters) })
  return { expenses: response.data.expenses, pagination: response.data.pagination }
}

export async function getExpense(id: string): Promise<Expense> {
  const response = await api.get<{ success: boolean; expense: Expense }>(`/expenses/${encodeURIComponent(id)}`)
  return response.data.expense
}

export async function createExpense(eventId: string, data: CreateExpenseRequest): Promise<Expense> {
  const response = await api.post<{ success: boolean; expense: Expense }>(`/events/${encodeURIComponent(eventId)}/expenses`, data)
  return response.data.expense
}

export async function updateExpense(id: string, data: UpdateExpenseRequest): Promise<Expense> {
  const response = await api.put<{ success: boolean; expense: Expense }>(`/expenses/${encodeURIComponent(id)}`, data)
  return response.data.expense
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`/expenses/${encodeURIComponent(id)}`)
}
