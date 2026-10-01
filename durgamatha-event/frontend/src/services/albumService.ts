import type { Album, AlbumInput, AlbumWithCover, AlbumWithDetails } from '../types/album'
import api from './api'

// All album API calls live here, so components never call Axios directly.
// The logged-in user's token is added automatically by the interceptor in api.ts.

// All albums, newest first. Optional filters: part of the name, and one event.
export async function getAlbums(filters: { search?: string; eventId?: string } = {}): Promise<AlbumWithDetails[]> {
  const params = {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
  }
  const response = await api.get<{ success: boolean; albums: AlbumWithDetails[] }>('/albums', { params })
  return response.data.albums
}

export async function getAlbumById(id: string): Promise<AlbumWithDetails> {
  const response = await api.get<{ success: boolean; album: AlbumWithDetails }>(`/albums/${encodeURIComponent(id)}`)
  return response.data.album
}

export async function getAlbumsByEvent(eventId: string): Promise<AlbumWithCover[]> {
  const response = await api.get<{ success: boolean; albums: AlbumWithCover[] }>(`/events/${encodeURIComponent(eventId)}/albums`)
  return response.data.albums
}

// The event id goes in the URL; the backend sets created_by from the logged-in user
export async function createAlbum(eventId: string, data: AlbumInput): Promise<Album> {
  const response = await api.post<{ success: boolean; album: Album }>(`/events/${encodeURIComponent(eventId)}/albums`, data)
  return response.data.album
}

export async function updateAlbum(id: string, data: AlbumInput): Promise<Album> {
  const response = await api.put<{ success: boolean; album: Album }>(`/albums/${encodeURIComponent(id)}`, data)
  return response.data.album
}

// Makes a photo/video of this album its cover; null removes the cover. Returns the updated album.
export async function setAlbumCover(albumId: string, mediaId: string | null): Promise<AlbumWithDetails> {
  const response = await api.put<{ success: boolean; album: AlbumWithDetails }>(`/albums/${encodeURIComponent(albumId)}/cover`, {
    media_id: mediaId,
  })
  return response.data.album
}

export async function deleteAlbum(id: string): Promise<void> {
  await api.delete(`/albums/${encodeURIComponent(id)}`)
}
