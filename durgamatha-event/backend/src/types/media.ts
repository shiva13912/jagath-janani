import type { CloudinaryResourceType } from '../config/cloudinary'

// A media row as stored in the media table. The file itself lives in Cloudinary;
// this is only its metadata and the Cloudinary references.
export interface Media {
  id: string
  album_id: string
  uploaded_by: string
  cloudinary_public_id: string
  secure_url: string
  resource_type: CloudinaryResourceType // 'image' | 'video'
  format: string
  original_filename: string
  file_size: number // bytes
  width: number | null
  height: number | null
  duration: number | null // seconds, videos only
  created_at: string
  updated_at: string
}

// What we save after a successful Cloudinary upload (id and timestamps come from the database)
export type NewMedia = Omit<Media, 'id' | 'created_at' | 'updated_at'>

// Result of one file in an upload request that failed
export interface MediaUploadError {
  filename: string
  message: string
}

// A media row with the name of its album (for the gallery, where items come from many albums)
export interface MediaWithAlbum extends Media {
  album: { id: string; name: string; event_id: string } | null
}

// Returned next to every paginated list
export interface Pagination {
  page: number
  limit: number
  total: number // number of items matching the filters, on all pages
  totalPages: number // 0 when nothing matches
}
