// An album as returned by the backend API (same field names as the database)
export interface Album {
  id: string
  event_id: string
  name: string
  description: string | null // null when the album has no description
  cover_media_id: string | null // reserved for Phase 5 (media)
  created_by: string
  created_at: string
  updated_at: string
}

// The event information the API sends along with an album
export interface AlbumEvent {
  id: string
  title: string
  event_date: string
  location: string
}

// GET /api/albums and GET /api/albums/:id return albums with their event and creator name
export interface AlbumWithDetails extends Album {
  event: AlbumEvent | null
  creator: { full_name: string } | null
}

// What the create and edit forms send to the backend
export interface AlbumInput {
  name: string
  description: string | null
}
