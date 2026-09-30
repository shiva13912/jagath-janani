import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import MediaGrid from '../components/MediaGrid'
import MediaUploader from '../components/MediaUploader'
import { useAuth } from '../hooks/useAuth'
import { getAlbumById } from '../services/albumService'
import { deleteMedia, getMediaByAlbum } from '../services/mediaService'
import type { AlbumWithDetails } from '../types/album'
import type { Media } from '../types/media'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { formatEventDate } from '../utils/date'
import { ADMIN_ROLES, hasRole, TEAM_ROLES } from '../utils/roles'

// Public page: one album, the event it belongs to, and its photos/videos.
// Team members and admins also get the upload panel; admins can delete media.
function AlbumDetailsPage() {
  const { albumId = '' } = useParams() // the :albumId part of the URL
  const [album, setAlbum] = useState<AlbumWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const { profile } = useAuth()
  const canUpload = hasRole(profile?.role, TEAM_ROLES) // the backend checks this again
  const canDelete = hasRole(profile?.role, ADMIN_ROLES)

  const [media, setMedia] = useState<Media[]>([])
  const [mediaLoading, setMediaLoading] = useState(true)
  const [mediaError, setMediaError] = useState('')
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState('')

  // Loads (or reloads) only THIS album's media
  const loadMedia = useCallback(() => {
    return getMediaByAlbum(albumId)
      .then((list) => {
        setMedia(list)
        setMediaError('')
      })
      .catch((err) => setMediaError(getErrorMessage(err)))
      .finally(() => setMediaLoading(false))
  }, [albumId])

  async function confirmDelete() {
    if (!mediaToDelete) return
    setDeleting(true)
    setSuccess('')
    try {
      await deleteMedia(mediaToDelete.id)
      setMediaToDelete(null)
      await loadMedia()
      setSuccess(`"${mediaToDelete.original_filename}" was deleted.`)
    } catch (err) {
      setMediaError(getErrorMessage(err))
      setMediaToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  useEffect(() => {
    getAlbumById(albumId)
      .then(setAlbum)
      .catch((err) => {
        if (isNotFoundError(err)) setNotFound(true)
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [albumId])

  // Go back to the album's event once we know it, otherwise to the events list
  const event = album?.event
  const backLink = event ? `/events/${event.id}` : '/events'

  return (
    <section className="mx-auto max-w-4xl">
      <Link to={backLink} className="text-orange-600 hover:underline">
        ← {event ? `Back to ${event.title}` : 'Back to events'}
      </Link>

      {loading && <p className="mt-6 text-gray-500">Loading album...</p>}

      {notFound && (
        <div className="mt-6">
          <h1 className="text-2xl font-bold">Album not found</h1>
          <p className="mt-2 text-gray-600">This album does not exist or has been removed.</p>
        </div>
      )}

      {error && <p className="mt-6 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      {album && (
        <>
          <article className="mt-6 rounded-lg bg-white p-6 shadow">
            <h1 className="text-2xl font-bold md:text-3xl">{album.name}</h1>
            {album.description && <p className="mt-3 whitespace-pre-line text-gray-800">{album.description}</p>}

            {event && (
              <dl className="mt-6 grid gap-4 border-t border-gray-200 pt-4 text-gray-700 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-gray-500">Event</dt>
                  <dd className="font-medium">
                    <Link to={`/events/${event.id}`} className="hover:text-orange-600">
                      {event.title}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Date</dt>
                  <dd className="font-medium">{formatEventDate(event.event_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Location</dt>
                  <dd className="font-medium">{event.location}</dd>
                </div>
              </dl>
            )}
          </article>

          {canUpload && <MediaUploader albumId={album.id} onUploaded={loadMedia} />}

          <h2 className="mt-8 text-xl font-semibold">Photos &amp; Videos</h2>
          {success && <p className="mt-3 rounded bg-green-50 px-3 py-2 text-green-700">{success}</p>}
          {mediaError && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">{mediaError}</p>}
          {mediaLoading && <p className="mt-3 text-gray-500">Loading photos and videos...</p>}
          {!mediaLoading && !mediaError && media.length === 0 && (
            <div className="mt-3 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
              No photos or videos have been added yet.
            </div>
          )}
          {media.length > 0 && (
            <div className="mt-3">
              <MediaGrid media={media} onDelete={canDelete ? setMediaToDelete : undefined} />
            </div>
          )}

          {/* Confirmation box: nothing is deleted until the admin clicks Delete here */}
          {mediaToDelete && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
                <h2 className="text-lg font-semibold">Delete {mediaToDelete.resource_type === 'video' ? 'video' : 'photo'}?</h2>
                <p className="mt-2 text-gray-600">
                  "{mediaToDelete.original_filename}" will be removed from Cloudinary and from the album. This cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaToDelete(null)}
                    disabled={deleting}
                    className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default AlbumDetailsPage
