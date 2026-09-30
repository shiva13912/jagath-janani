import type { Media, MediaUploadResult } from '../types/media'
import api from './api'

// All media API calls live here. The files go to our backend, which sends them to Cloudinary.

export async function getMediaByAlbum(albumId: string): Promise<Media[]> {
  const response = await api.get<{ success: boolean; media: Media[] }>(`/albums/${encodeURIComponent(albumId)}/media`)
  return response.data.media
}

export async function getMediaById(id: string): Promise<Media> {
  const response = await api.get<{ success: boolean; media: Media }>(`/media/${encodeURIComponent(id)}`)
  return response.data.media
}

// Uploads files to an album. onProgress receives 0-100: the REAL share of bytes sent so far,
// reported by the browser through Axios.
export async function uploadMedia(
  albumId: string,
  files: File[],
  onProgress: (percent: number) => void,
): Promise<MediaUploadResult> {
  // FormData is how browsers send files ("multipart/form-data"); all files go in the "files" field
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await api.post<{ success: boolean } & MediaUploadResult>(
    `/albums/${encodeURIComponent(albumId)}/media`,
    formData,
    {
      // Replaces the default JSON type; the browser adds the multipart "boundary" itself
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 10 * 60 * 1000, // big videos can take a while: allow up to 10 minutes
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    },
  )
  return { media: response.data.media, errors: response.data.errors }
}

export async function deleteMedia(id: string): Promise<void> {
  await api.delete(`/media/${encodeURIComponent(id)}`)
}
