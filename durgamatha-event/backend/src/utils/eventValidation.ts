import type { EventInput } from '../types/event'

export const TITLE_MAX_LENGTH = 150
export const LOCATION_MAX_LENGTH = 200
export const DESCRIPTION_MAX_LENGTH = 5000

// Result of checking a request body: either clean data, or a list of problems
type ValidationResult = { data: EventInput; errors: [] } | { data: null; errors: string[] }

// true for a real calendar date written as YYYY-MM-DD (rejects 2026-02-30, "tomorrow", etc.)
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// true for a UUID like 3f2b8c1e-...; used to reject ids like "nonexistent-id" early
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

// Reads a text field from the body, trimmed. Returns '' if it is missing or not text.
function readText(body: Record<string, unknown>, field: string): string {
  const value = body[field]
  return typeof value === 'string' ? value.trim() : ''
}

// Checks the body of POST /api/events and PUT /api/events/:id.
// Only title, description, event_date and location are read; anything else
// (id, created_by, role, ...) is ignored, so the client cannot set it.
export function validateEventInput(body: unknown): ValidationResult {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  const title = readText(input, 'title')
  const description = readText(input, 'description')
  const eventDate = readText(input, 'event_date')
  const location = readText(input, 'location')

  const errors: string[] = []
  if (!title) errors.push('Title is required.')
  else if (title.length > TITLE_MAX_LENGTH) errors.push(`Title must be at most ${TITLE_MAX_LENGTH} characters.`)

  if (!description) errors.push('Description is required.')
  else if (description.length > DESCRIPTION_MAX_LENGTH) errors.push(`Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`)

  if (!eventDate) errors.push('Event date is required.')
  else if (!isValidDate(eventDate)) errors.push('Event date must be a valid date in YYYY-MM-DD format.')

  if (!location) errors.push('Location is required.')
  else if (location.length > LOCATION_MAX_LENGTH) errors.push(`Location must be at most ${LOCATION_MAX_LENGTH} characters.`)

  if (errors.length > 0) return { data: null, errors }
  return { data: { title, description, event_date: eventDate, location }, errors: [] }
}
