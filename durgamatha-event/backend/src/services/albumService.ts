import { supabaseAdmin } from '../config/supabase'
import type { Album, AlbumInput, AlbumWithDetails } from '../types/album'

// All database work for albums lives here. Controllers call these functions.
// Database errors are thrown; the error handler turns them into a 500 response.

// Columns for album + its event + the creator's name, in one query.
// "event:events(...)" follows albums.event_id to the events table, and
// "creator:profiles(full_name)" follows albums.created_by to profiles.
// Only the creator's display name is selected: never their email or role.
const ALBUM_WITH_DETAILS = '*, event:events(id, title, event_date, location), creator:profiles(full_name)'

// All albums (newest first), with their event and creator
export async function getAllAlbums(): Promise<AlbumWithDetails[]> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select(ALBUM_WITH_DETAILS)
    .order('created_at', { ascending: false })
    .returns<AlbumWithDetails[]>()

  if (error) throw new Error(`Could not load albums: ${error.message}`)
  return data
}

// The albums of one event, in the order they were created
export async function getAlbumsByEvent(eventId: string): Promise<Album[]> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .returns<Album[]>()

  if (error) throw new Error(`Could not load albums: ${error.message}`)
  return data
}

// Returns null if there is no album with this id
export async function getAlbumById(id: string): Promise<AlbumWithDetails | null> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select(ALBUM_WITH_DETAILS)
    .eq('id', id)
    .maybeSingle<AlbumWithDetails>()

  if (error) throw new Error(`Could not load album: ${error.message}`)
  return data
}

// eventId comes from the URL (the controller has checked the event exists);
// createdBy always comes from the logged-in user (req.user.id), never from the request body
export async function createAlbum(eventId: string, input: AlbumInput, createdBy: string): Promise<Album> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .insert({ ...input, event_id: eventId, created_by: createdBy })
    .select('*')
    .single<Album>()

  if (error) throw new Error(`Could not create album: ${error.message}`)
  return data
}

// Only name and description are updated. updated_at is set by the database trigger.
// Returns null if there is no album with this id.
export async function updateAlbum(id: string, input: AlbumInput): Promise<Album | null> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .update(input)
    .eq('id', id)
    .select('*')
    .maybeSingle<Album>()

  if (error) throw new Error(`Could not update album: ${error.message}`)
  return data
}

// Returns false if there was no album with this id.
// No media exists yet, so deleting the album row is all that is needed (Phase 5 will change this).
export async function deleteAlbum(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from('albums').delete().eq('id', id).select('id')

  if (error) throw new Error(`Could not delete album: ${error.message}`)
  return data.length > 0
}
