// An album as stored in the albums table.
// Field names match the database columns (snake_case), like Event.
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

// The event information shown next to an album
export interface AlbumEvent {
  id: string
  title: string
  event_date: string
  location: string
}

// An album together with its event and the creator's name.
// Returned by GET /api/albums and GET /api/albums/:id.
export interface AlbumWithDetails extends Album {
  event: AlbumEvent | null
  creator: { full_name: string } | null
}

// The only fields a client may send. event_id comes from the URL and
// created_by from the logged-in user, so neither is part of the request.
export interface AlbumInput {
  name: string
  description: string | null
}

export type CreateAlbumRequest = AlbumInput
// PUT replaces both editable fields, so update sends the same data as create
export type UpdateAlbumRequest = AlbumInput
