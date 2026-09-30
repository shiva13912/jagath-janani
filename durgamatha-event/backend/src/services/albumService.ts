import { supabaseAdmin } from '../config/supabase'
import type { Album, AlbumInput, AlbumWithCover, AlbumWithDetails } from '../types/album'

// All database work for albums lives here. Controllers call these functions.
// Database errors are thrown; the error handler turns them into a 500 response.

// The album's cover photo/video, fetched in the SAME query as the album, so a page of
// album cards needs one request, not one per album. "!albums_cover_media_id_fkey" names
// which link to follow: albums and media are connected twice (media.album_id and
// albums.cover_media_id), so Supabase needs to be told which one we mean.
const COVER = 'cover:media!albums_cover_media_id_fkey(id, secure_url, resource_type)'

// Columns for album + its event + the creator's name + its cover, in one query.
// "event:events(...)" follows albums.event_id to the events table, and
// "creator:profiles(full_name)" follows albums.created_by to profiles.
// Only the creator's display name is selected: never their email or role.
export interface AlbumFilters {
  search: string | null // part of the album name
  eventId: string | null
}

const ALBUM_WITH_DETAILS = `*, event:events(id, title, event_date, location), creator:profiles(full_name), ${COVER}`

// All albums (newest first), with their event, creator and cover.
// Optional filters: part of the name (case-insensitive) and one event.
export async function getAllAlbums(filters: AlbumFilters = { search: null, eventId: null }): Promise<AlbumWithDetails[]> {
  let query = supabaseAdmin.from('albums').select(ALBUM_WITH_DETAILS)

  // ilike = "LIKE, ignoring upper/lower case"; %text% matches the text anywhere in the name.
  // The search text has no % or _ left in it (see validateAlbumQuery).
  if (filters.search) query = query.ilike('name', `%${filters.search}%`)
  if (filters.eventId) query = query.eq('event_id', filters.eventId)

  const { data, error } = await query.order('created_at', { ascending: false }).returns<AlbumWithDetails[]>()

  if (error) throw new Error(`Could not load albums: ${error.message}`)
  return data
}

// The albums of one event (with their covers), in the order they were created
export async function getAlbumsByEvent(eventId: string): Promise<AlbumWithCover[]> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .select(`*, ${COVER}`)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })
    .returns<AlbumWithCover[]>()

  if (error) throw new Error(`Could not load albums: ${error.message}`)
  return data
}

// Only the ids of one event's albums (used by the gallery's event filter)
export async function getAlbumIdsByEvent(eventId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin.from('albums').select('id').eq('event_id', eventId).returns<{ id: string }[]>()

  if (error) throw new Error(`Could not load albums: ${error.message}`)
  return data.map((album) => album.id)
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

// Sets (or, with null, removes) the album's cover. The controller has already checked that
// the media belongs to this album. Returns null if there is no album with this id.
export async function setAlbumCover(id: string, mediaId: string | null): Promise<Album | null> {
  const { data, error } = await supabaseAdmin
    .from('albums')
    .update({ cover_media_id: mediaId })
    .eq('id', id)
    .select('*')
    .maybeSingle<Album>()

  if (error) throw new Error(`Could not set album cover: ${error.message}`)
  return data
}

// Returns false if there was no album with this id.
// The database deletes the album's media rows too (ON DELETE CASCADE).
// The controller deletes the Cloudinary files first.
export async function deleteAlbum(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from('albums').delete().eq('id', id).select('id')

  if (error) throw new Error(`Could not delete album: ${error.message}`)
  return data.length > 0
}
