import type { MediaPage, MediaTypeFilter, MediaUploadResult } from '../types/media'
import api from './api'

// All media API calls live here. The files go to our backend, which sends them to Cloudinary.

// Turns the page/type choices into query parameters. "all" is simply left out.
function pageParams(options: { page: number; type: MediaTypeFilter; limit?: number }) {
  return {
    page: options.page,
    ...(options.limit ? { limit: options.limit } : {}),
    ...(options.type !== 'all' ? { type: options.type } : {}),
  }
}

// One page of an album's photos/videos, newest first (24 per page unless a limit is given)
export async function getAlbumMediaPage(
  albumId: string,
  options: { page: number; type: MediaTypeFilter; limit?: number },
): Promise<MediaPage> {
  const response = await api.get<{ success: boolean } & MediaPage>(`/albums/${encodeURIComponent(albumId)}/media`, {
    params: pageParams(options), // Axios turns this into ?page=1&type=image
  })
  return { media: response.data.media, pagination: response.data.pagination }
}

// One page of the public gallery. Empty filters mean "all events" / "all albums".
export async function getGalleryMedia(options: {
  page: number
  type: MediaTypeFilter
  eventId: string
  albumId: string
}): Promise<MediaPage> {
  const response = await api.get<{ success: boolean } & MediaPage>('/media', {
    params: {
      ...pageParams(options),
      ...(options.eventId ? { eventId: options.eventId } : {}),
      ...(options.albumId ? { albumId: options.albumId } : {}),
    },
  })
  return { media: response.data.media, pagination: response.data.pagination }
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
