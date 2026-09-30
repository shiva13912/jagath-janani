import { supabaseAdmin } from '../config/supabase'
import type { CreateExpenseRequest, Expense, FinanceList, FinanceQuery, UpdateExpenseRequest } from '../types/finance'
import { toMoney } from '../utils/money'

// All database work for expenses lives here. Controllers call these functions.
// Database errors are thrown; the error handler turns them into a 500 response
// (the browser only ever sees "Something went wrong", never the PostgreSQL message).

// Every expense row comes with its event's title and the creator's name
const EXPENSE_WITH_LINKS = '*, event:events(id,title), creator:profiles(full_name)'

// The database sends amount as a number; the API always returns exact text like "1500.00"
type ExpenseRow = Omit<Expense, 'amount'> & { amount: number | string }
function fromRow(row: ExpenseRow): Expense {
  return { ...row, amount: toMoney(row.amount) }
}

// One page of expenses, newest date first, with optional event, category and date filters
export async function listExpenses(filters: FinanceQuery): Promise<FinanceList<Expense>> {
  const from = (filters.page - 1) * filters.limit
  let query = supabaseAdmin.from('expenses').select(EXPENSE_WITH_LINKS, { count: 'exact' })
  if (filters.eventId) query = query.eq('event_id', filters.eventId)
  if (filters.category) query = query.eq('category', filters.category)
  if (filters.from) query = query.gte('spent_date', filters.from)
  if (filters.to) query = query.lte('spent_date', filters.to)

  const { data, count, error } = await query
    .order('spent_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true }) // tie-breaker, so rows never swap pages
    .range(from, from + filters.limit - 1)
    .returns<ExpenseRow[]>()

  // A page after the last one: an empty page, but still the real total
  if (error?.code === 'PGRST103') {
    let countQuery = supabaseAdmin.from('expenses').select('id', { count: 'exact', head: true })
    if (filters.eventId) countQuery = countQuery.eq('event_id', filters.eventId)
    if (filters.category) countQuery = countQuery.eq('category', filters.category)
    if (filters.from) countQuery = countQuery.gte('spent_date', filters.from)
    if (filters.to) countQuery = countQuery.lte('spent_date', filters.to)
    const counted = await countQuery
    if (counted.error) throw new Error(`Could not count expenses: ${counted.error.message}`)
    return { records: [], total: counted.count ?? 0 }
  }
  if (error) throw new Error(`Could not load expenses: ${error.message}`)
  return { records: data.map(fromRow), total: count ?? 0 }
}

// Returns null if there is no expense with this id
export async function getExpenseById(id: string): Promise<Expense | null> {
  const { data, error } = await supabaseAdmin.from('expenses').select(EXPENSE_WITH_LINKS).eq('id', id).maybeSingle<ExpenseRow>()

  if (error) throw new Error(`Could not load expense: ${error.message}`)
  return data ? fromRow(data) : null
}

// eventId comes from the URL and createdBy from the logged-in user, never from the request body
export async function createExpense(eventId: string, input: CreateExpenseRequest, createdBy: string): Promise<Expense> {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({ ...input, event_id: eventId, created_by: createdBy })
    .select(EXPENSE_WITH_LINKS)
    .single<ExpenseRow>()

  if (error) throw new Error(`Could not create expense: ${error.message}`)
  return fromRow(data)
}

// Only the editable fields are updated; event_id, created_by and created_at never change.
// Returns null if there is no expense with this id.
export async function updateExpense(id: string, input: UpdateExpenseRequest): Promise<Expense | null> {
  const { data, error } = await supabaseAdmin
    .from('expenses')
    .update(input)
    .eq('id', id)
    .select(EXPENSE_WITH_LINKS)
    .maybeSingle<ExpenseRow>()

  if (error) throw new Error(`Could not update expense: ${error.message}`)
  return data ? fromRow(data) : null
}

// Returns false if there was no expense with this id
export async function deleteExpense(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from('expenses').delete().eq('id', id).select('id')

  if (error) throw new Error(`Could not delete expense: ${error.message}`)
  return data.length > 0
}
