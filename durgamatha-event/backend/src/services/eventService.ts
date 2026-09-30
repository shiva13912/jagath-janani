import { supabaseAdmin } from '../config/supabase'
import type { Event, EventInput } from '../types/event'

// All database work for events lives here. Controllers call these functions.
// Database errors are thrown; the error handler turns them into a 500 response.

// Today's date as "YYYY-MM-DD" (server time, UTC)
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// Upcoming events first (soonest at the top), then past events (most recent at the top)
export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .returns<Event[]>()

  if (error) throw new Error(`Could not load events: ${error.message}`)

  // "YYYY-MM-DD" strings compare correctly as text, so no date parsing is needed
  const upcoming = data.filter((event) => event.event_date >= today())
  const past = data.filter((event) => event.event_date < today()).reverse()
  return [...upcoming, ...past]
}

// Returns null if there is no event with this id
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabaseAdmin.from('events').select('*').eq('id', id).maybeSingle<Event>()

  if (error) throw new Error(`Could not load event: ${error.message}`)
  return data
}

// createdBy always comes from the logged-in user (req.user.id), never from the request body
export async function createEvent(input: EventInput, createdBy: string): Promise<Event> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .insert({ ...input, created_by: createdBy })
    .select('*')
    .single<Event>()

  if (error) throw new Error(`Could not create event: ${error.message}`)
  return data
}

// Only the four editable fields are updated. updated_at is set by the database trigger.
// Returns null if there is no event with this id.
export async function updateEvent(id: string, input: EventInput): Promise<Event | null> {
  const { data, error } = await supabaseAdmin
    .from('events')
    .update(input)
    .eq('id', id)
    .select('*')
    .maybeSingle<Event>()

  if (error) throw new Error(`Could not update event: ${error.message}`)
  return data
}

// Returns false if there was no event with this id.
// Nothing else depends on events yet (albums come in a later phase), so a plain delete is enough.
export async function deleteEvent(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from('events').delete().eq('id', id).select('id')

  if (error) throw new Error(`Could not delete event: ${error.message}`)
  return data.length > 0
}
