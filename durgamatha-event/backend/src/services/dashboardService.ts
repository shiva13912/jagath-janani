import { supabaseAdmin } from '../config/supabase'
import type { DashboardStats, EventDashboardSummary } from '../types/finance'

// The totals are calculated INSIDE PostgreSQL by two SQL functions (see the Phase 7
// section of supabase/schema.sql). Counting and summing in the database is correct for
// any number of rows; the Supabase API would only ever send us 1000 rows to add up.
// Money comes back as exact text like "55000.00"; the balance is calculated, never stored.

export async function getDashboardSummary(): Promise<DashboardStats> {
  const { data, error } = await supabaseAdmin.rpc('get_dashboard_summary')

  if (error) throw new Error(`Could not load dashboard totals: ${error.message}`)
  return data as DashboardStats
}

// Returns null if there is no event with this id
export async function getEventSummary(eventId: string): Promise<EventDashboardSummary | null> {
  const { data, error } = await supabaseAdmin.rpc('get_event_summary', { p_event_id: eventId })

  if (error) throw new Error(`Could not load event totals: ${error.message}`)
  return data as EventDashboardSummary | null // the SQL function returns NULL for an unknown event
}
