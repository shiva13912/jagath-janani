import type { Album, AlbumInput, AlbumWithDetails } from '../types/album'
import api from './api'

// All album API calls live here, so components never call Axios directly.
// The logged-in user's token is added automatically by the interceptor in api.ts.

export async function getAlbums(): Promise<AlbumWithDetails[]> {
  const response = await api.get<{ success: boolean; albums: AlbumWithDetails[] }>('/albums')
  return response.data.albums
}

export async function getAlbumById(id: string): Promise<AlbumWithDetails> {
  const response = await api.get<{ success: boolean; album: AlbumWithDetails }>(`/albums/${encodeURIComponent(id)}`)
  return response.data.album
}

export async function getAlbumsByEvent(eventId: string): Promise<Album[]> {
  const response = await api.get<{ success: boolean; albums: Album[] }>(`/events/${encodeURIComponent(eventId)}/albums`)
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

export async function deleteAlbum(id: string): Promise<void> {
  await api.delete(`/albums/${encodeURIComponent(id)}`)
}
