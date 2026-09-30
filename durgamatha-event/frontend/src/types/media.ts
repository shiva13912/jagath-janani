// A photo or video as returned by the backend. The file itself is stored in Cloudinary;
// secure_url is its https address.
export interface Media {
  id: string
  album_id: string
  uploaded_by: string
  cloudinary_public_id: string
  secure_url: string
  resource_type: 'image' | 'video'
  format: string
  original_filename: string
  file_size: number // bytes
  width: number | null
  height: number | null
  duration: number | null // seconds, videos only
  created_at: string
  updated_at: string
}

// POST /api/albums/:albumId/media answers with the saved files and the ones that failed
export interface MediaUploadResult {
  media: Media[]
  errors: { filename: string; message: string }[]
}
