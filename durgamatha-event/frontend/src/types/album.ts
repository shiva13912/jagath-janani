// An album as returned by the backend API (same field names as the database)
export interface Album {
  id: string
  event_id: string
  name: string
  description: string | null // null when the album has no description
  cover_media_id: string | null // the cover photo/video, or null
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

// Just enough of the cover photo/video to show it on an album card
export interface AlbumCover {
  id: string
  secure_url: string
  resource_type: 'image' | 'video'
}

// Album lists come with the cover already included (null = no cover chosen)
export interface AlbumWithCover extends Album {
  cover: AlbumCover | null
}

// GET /api/albums and GET /api/albums/:id return albums with their event, creator name and cover
export interface AlbumWithDetails extends AlbumWithCover {
  event: AlbumEvent | null
  creator: { full_name: string } | null
}

// What the create and edit forms send to the backend
export interface AlbumInput {
  name: string
  description: string | null
}
