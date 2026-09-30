import { supabaseAdmin } from '../config/supabase'
import type { CreateIncomeRequest, FinanceList, FinanceQuery, Income, UpdateIncomeRequest } from '../types/finance'
import { toMoney } from '../utils/money'

// All database work for income lives here. Controllers call these functions.
// Database errors are thrown; the error handler turns them into a 500 response
// (the browser only ever sees "Something went wrong", never the PostgreSQL message).

// Every income row comes with its event's title and the creator's name
const INCOME_WITH_LINKS = '*, event:events(id,title), creator:profiles(full_name)'

// The database sends amount as a number; the API always returns exact text like "1500.00"
type IncomeRow = Omit<Income, 'amount'> & { amount: number | string }
function fromRow(row: IncomeRow): Income {
  return { ...row, amount: toMoney(row.amount) }
}

// One page of income, newest date first, with optional event and date filters
export async function listIncome(filters: FinanceQuery): Promise<FinanceList<Income>> {
  const from = (filters.page - 1) * filters.limit
  let query = supabaseAdmin.from('income').select(INCOME_WITH_LINKS, { count: 'exact' })
  if (filters.eventId) query = query.eq('event_id', filters.eventId)
  if (filters.from) query = query.gte('received_date', filters.from)
  if (filters.to) query = query.lte('received_date', filters.to)

  const { data, count, error } = await query
    .order('received_date', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true }) // tie-breaker, so rows never swap pages
    .range(from, from + filters.limit - 1)
    .returns<IncomeRow[]>()

  // A page after the last one: an empty page, but still the real total
  if (error?.code === 'PGRST103') {
    let countQuery = supabaseAdmin.from('income').select('id', { count: 'exact', head: true })
    if (filters.eventId) countQuery = countQuery.eq('event_id', filters.eventId)
    if (filters.from) countQuery = countQuery.gte('received_date', filters.from)
    if (filters.to) countQuery = countQuery.lte('received_date', filters.to)
    const counted = await countQuery
    if (counted.error) throw new Error(`Could not count income: ${counted.error.message}`)
    return { records: [], total: counted.count ?? 0 }
  }
  if (error) throw new Error(`Could not load income: ${error.message}`)
  return { records: data.map(fromRow), total: count ?? 0 }
}

// Returns null if there is no income record with this id
export async function getIncomeById(id: string): Promise<Income | null> {
  const { data, error } = await supabaseAdmin.from('income').select(INCOME_WITH_LINKS).eq('id', id).maybeSingle<IncomeRow>()

  if (error) throw new Error(`Could not load income: ${error.message}`)
  return data ? fromRow(data) : null
}

// eventId comes from the URL and createdBy from the logged-in user, never from the request body
export async function createIncome(eventId: string, input: CreateIncomeRequest, createdBy: string): Promise<Income> {
  const { data, error } = await supabaseAdmin
    .from('income')
    .insert({ ...input, event_id: eventId, created_by: createdBy })
    .select(INCOME_WITH_LINKS)
    .single<IncomeRow>()

  if (error) throw new Error(`Could not create income: ${error.message}`)
  return fromRow(data)
}

// Only the editable fields are updated; event_id, created_by and created_at never change.
// Returns null if there is no income record with this id.
export async function updateIncome(id: string, input: UpdateIncomeRequest): Promise<Income | null> {
  const { data, error } = await supabaseAdmin
    .from('income')
    .update(input)
    .eq('id', id)
    .select(INCOME_WITH_LINKS)
    .maybeSingle<IncomeRow>()

  if (error) throw new Error(`Could not update income: ${error.message}`)
  return data ? fromRow(data) : null
}

// Returns false if there was no income record with this id
export async function deleteIncome(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from('income').delete().eq('id', id).select('id')

  if (error) throw new Error(`Could not delete income: ${error.message}`)
  return data.length > 0
}
