// An event as stored in the events table and returned by the API.
// Field names match the database columns (snake_case), so no conversion is needed.
export interface Event {
  id: string
  title: string
  description: string
  event_date: string // "YYYY-MM-DD"
  location: string
  cover_media_id: string | null // reserved for the media phase
  created_by: string
  created_at: string
  updated_at: string
}

// The only fields a client may send when creating or updating an event.
// id, created_by, created_at and updated_at are always set by the server/database.
export interface EventInput {
  title: string
  description: string
  event_date: string
  location: string
}

// PUT replaces all editable fields, so create and update send the same data
export type CreateEventRequest = EventInput
export type UpdateEventRequest = EventInput
