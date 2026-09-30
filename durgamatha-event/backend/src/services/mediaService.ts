import { deleteAsset, deleteAssets, uploadFile, type CloudinaryResourceType } from '../config/cloudinary'
import { supabaseAdmin } from '../config/supabase'
import type { Media, NewMedia } from '../types/media'
import { ALLOWED_IMAGE_FORMATS, ALLOWED_VIDEO_FORMATS, FileRejectedError } from '../utils/mediaValidation'

// All media work lives here: Cloudinary (the files) + PostgreSQL (the metadata).
// Rule: the database row and the Cloudinary file must always exist together.

// Cloudinary folder for an album, e.g. "durgamatha/events/<eventId>/albums/<albumId>"
export function albumFolder(eventId: string, albumId: string): string {
  return `durgamatha/events/${eventId}/albums/${albumId}`
}

// The media of one album, oldest first
export async function getMediaByAlbum(albumId: string): Promise<Media[]> {
  const { data, error } = await supabaseAdmin
    .from('media')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: true })
    .returns<Media[]>()

  if (error) throw new Error(`Could not load media: ${error.message}`)
  return data
}

// Returns null if there is no media with this id
export async function getMediaById(id: string): Promise<Media | null> {
  const { data, error } = await supabaseAdmin.from('media').select('*').eq('id', id).maybeSingle<Media>()

  if (error) throw new Error(`Could not load media: ${error.message}`)
  return data
}

// Uploads one file (already validated) to Cloudinary, then saves its metadata.
// If saving to the database fails, the new Cloudinary file is deleted again,
// so no "orphan" file is left in Cloudinary without a database row.
export async function uploadMedia(options: {
  filePath: string // the temporary file multer wrote
  originalFilename: string
  kind: CloudinaryResourceType
  albumId: string
  eventId: string
  uploadedBy: string // always the logged-in user (req.user.id)
}): Promise<Media> {
  // 1. Upload the file to Cloudinary
  const result = await uploadFile(options.filePath, albumFolder(options.eventId, options.albumId), options.kind)

  // 2. Double-check what Cloudinary actually received (the real file content, not just its name)
  const allowedFormats = options.kind === 'image' ? ALLOWED_IMAGE_FORMATS : ALLOWED_VIDEO_FORMATS
  if (result.resource_type !== options.kind || !allowedFormats.includes(result.format)) {
    await deleteAsset(result.public_id, result.resource_type === 'video' ? 'video' : 'image')
    throw new FileRejectedError('The file content does not match an allowed photo or video type.')
  }

  // 3. Save only the metadata and Cloudinary references in PostgreSQL
  const newMedia: NewMedia = {
    album_id: options.albumId,
    uploaded_by: options.uploadedBy,
    cloudinary_public_id: result.public_id,
    secure_url: result.secure_url,
    resource_type: options.kind,
    format: result.format,
    original_filename: options.originalFilename,
    file_size: result.bytes,
    width: typeof result.width === 'number' ? result.width : null,
    height: typeof result.height === 'number' ? result.height : null,
    // Cloudinary sends "duration" (seconds) for videos only
    duration: typeof result.duration === 'number' ? result.duration : null,
  }

  const { data, error } = await supabaseAdmin.from('media').insert(newMedia).select('*').single<Media>()

  if (error) {
    // 4. Database failed: remove the file we just uploaded so the two stay in sync
    try {
      await deleteAsset(result.public_id, options.kind)
    } catch (cleanupError) {
      // Could not clean up: log the id so it can be removed by hand in the Cloudinary console
      console.error(`ORPHANED CLOUDINARY FILE ${result.public_id}:`, cleanupError)
    }
    throw new Error(`Could not save media: ${error.message}`)
  }
  return data
}

// Deletes one media item: the Cloudinary file FIRST, then the database row.
// If Cloudinary fails, a CloudinaryError is thrown and the row is kept, so the admin can try again.
// (If the row delete then fails, the next try finds the file already gone and removes the row.)
export async function deleteMedia(media: Media): Promise<void> {
  await deleteAsset(media.cloudinary_public_id, media.resource_type)

  const { error } = await supabaseAdmin.from('media').delete().eq('id', media.id)
  if (error) throw new Error(`Could not delete media record: ${error.message}`)
}

// Deletes the Cloudinary files of all media in these albums. Used BEFORE deleting an album or
// event: the database then removes the media rows itself (ON DELETE CASCADE).
// If Cloudinary fails, this throws and the caller must not delete anything.
export async function deleteFilesOfAlbums(albumIds: string[]): Promise<void> {
  if (albumIds.length === 0) return

  const { data, error } = await supabaseAdmin
    .from('media')
    .select('cloudinary_public_id, resource_type')
    .in('album_id', albumIds)
    .returns<Pick<Media, 'cloudinary_public_id' | 'resource_type'>[]>()

  if (error) throw new Error(`Could not load media: ${error.message}`)

  await deleteAssets(data.map((media) => ({ publicId: media.cloudinary_public_id, resourceType: media.resource_type })))
}
