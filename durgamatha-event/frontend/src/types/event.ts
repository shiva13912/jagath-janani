// An event as returned by the backend API (same field names as the database)
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

// The fields an admin fills in when creating or editing an event
export interface EventInput {
  title: string
  description: string
  event_date: string
  location: string
}
