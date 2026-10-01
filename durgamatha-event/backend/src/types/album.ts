// An album as stored in the albums table.
// Field names match the database columns (snake_case), like Event.
export interface Album {
  id: string
  event_id: string
  name: string
  description: string | null // null when the album has no description
  cover_media_id: string | null // the cover photo/video (media.id), or null
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

// Just enough of the cover photo/video to show it on an album card
export interface AlbumCover {
  id: string
  secure_url: string
  resource_type: 'image' | 'video'
}

// An album with its cover (null when no cover is chosen)
export interface AlbumWithCover extends Album {
  cover: AlbumCover | null
}

// An album together with its event, the creator's name and its cover.
// Returned by GET /api/albums and GET /api/albums/:id.
export interface AlbumWithDetails extends AlbumWithCover {
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
