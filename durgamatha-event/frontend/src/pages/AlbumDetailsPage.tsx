import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import MediaGrid from '../components/MediaGrid'
import MediaUploader from '../components/MediaUploader'
import MediaViewer from '../components/MediaViewer'
import Pagination from '../components/Pagination'
import SkeletonGrid from '../components/SkeletonGrid'
import TypeFilter from '../components/TypeFilter'
import { useAuth } from '../hooks/useAuth'
import { usePagedMedia } from '../hooks/usePagedMedia'
import { getAlbumById, setAlbumCover } from '../services/albumService'
import { deleteMedia, getAlbumMediaPage } from '../services/mediaService'
import type { AlbumWithDetails } from '../types/album'
import type { MediaTypeFilter } from '../types/media'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { formatEventDate } from '../utils/date'
import { emptyMessage, readPage, readType } from '../utils/galleryParams'
import { ADMIN_ROLES, hasRole, TEAM_ROLES } from '../utils/roles'

// Public album gallery: the album, its event, and its photos/videos page by page.
// Team members and admins can also upload and choose the cover; admins can delete.
function AlbumDetailsPage() {
  const { albumId = '' } = useParams() // the :albumId part of the URL
  const [album, setAlbum] = useState<AlbumWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  const { profile } = useAuth()
  const canUpload = hasRole(profile?.role, TEAM_ROLES) // the backend checks this again
  const canSetCover = hasRole(profile?.role, TEAM_ROLES) // same people who can edit albums
  const canDelete = hasRole(profile?.role, ADMIN_ROLES)

  // ?page=2&type=video in the URL
  const [searchParams, setSearchParams] = useSearchParams()
  const page = readPage(searchParams.get('page'))
  const type = readType(searchParams.get('type'))

  const changeFilters = useCallback(
    (next: { page?: number; type?: MediaTypeFilter }) => {
      setSearchParams((params) => {
        const newType = next.type ?? readType(params.get('type'))
        const newPage = next.page ?? 1 // a new filter starts again at page 1
        const result = new URLSearchParams()
        if (newType !== 'all') result.set('type', newType)
        if (newPage > 1) result.set('page', String(newPage))
        return result
      })
    },
    [setSearchParams],
  )
  const setPage = useCallback((newPage: number) => changeFilters({ page: newPage }), [changeFilters])

  const loadPage = useCallback((pageNumber: number) => getAlbumMediaPage(albumId, { page: pageNumber, type }), [albumId, type])
  const gallery = usePagedMedia(loadPage, page, setPage)

  // Result of the last viewer action (set cover / delete). It remembers WHICH item it was
  // about, so moving to another photo doesn't keep showing "Album cover updated."
  const [busy, setBusy] = useState(false)
  const [actionResult, setActionResult] = useState<{ mediaId: string; text: string; isError: boolean } | null>(null)
  const [success, setSuccess] = useState('') // shown above the grid

  useEffect(() => {
    getAlbumById(albumId)
      .then(setAlbum)
      .catch((err) => {
        if (isNotFoundError(err)) setNotFound(true)
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [albumId])

  async function toggleCover() {
    const item = gallery.viewerItem
    if (!album || !item) return
    const removing = album.cover_media_id === item.id
    setBusy(true)
    setActionResult(null)
    try {
      const updated = await setAlbumCover(album.id, removing ? null : item.id)
      setAlbum(updated)
      setActionResult({ mediaId: item.id, text: removing ? 'Album cover removed.' : 'Album cover updated.', isError: false })
    } catch (err) {
      setActionResult({ mediaId: item.id, text: getErrorMessage(err), isError: true })
    } finally {
      setBusy(false)
    }
  }

  async function deleteCurrent() {
    const item = gallery.viewerItem
    if (!album || !item) return
    setBusy(true)
    setActionResult(null)
    try {
      await deleteMedia(item.id)
      // The database also cleared the cover if this was it; show that without another request
      if (album.cover_media_id === item.id) setAlbum({ ...album, cover_media_id: null, cover: null })
      gallery.closeViewer()
      gallery.reload()
      setSuccess(`"${item.original_filename}" was deleted.`)
    } catch (err) {
      setActionResult({ mediaId: item.id, text: getErrorMessage(err), isError: true })
    } finally {
      setBusy(false)
    }
  }

  // After an upload, show page 1 of "All", where the new files are (newest first)
  function handleUploaded() {
    setSuccess('')
    changeFilters({ page: 1, type: 'all' })
    gallery.reload()
  }

  // Go back to the album's event once we know it, otherwise to the events list
  const event = album?.event
  const backLink = event ? `/events/${event.id}` : '/events'
  const { media, pagination } = gallery
  const result = actionResult && actionResult.mediaId === gallery.viewerItem?.id ? actionResult : null

  return (
    <section className="mx-auto max-w-6xl">
      <Link to={backLink} className="text-orange-600 hover:underline">
        ← {event ? `Back to ${event.title}` : 'Back to events'}
      </Link>

      {loading && (
        <p role="status" className="mt-6 text-gray-500">
          Loading album...
        </p>
      )}

      {notFound && (
        <div className="mt-6">
          <h1 className="text-2xl font-bold">Album not found</h1>
          <p className="mt-2 text-gray-600">This album does not exist or has been removed.</p>
          <Link to="/gallery" className="mt-4 inline-block text-orange-600 hover:underline">
            Browse the gallery
          </Link>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded bg-red-50 px-3 py-2 text-red-700">
          {error}
        </p>
      )}

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

          {canUpload && <MediaUploader albumId={album.id} onUploaded={handleUploaded} />}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Photos &amp; Videos
              {pagination && pagination.total > 0 && <span className="ml-2 text-base font-normal text-gray-500">({pagination.total})</span>}
            </h2>
            <TypeFilter value={type} onChange={(value) => changeFilters({ type: value })} />
          </div>

          {success && (
            <p role="status" className="mt-3 rounded bg-green-50 px-3 py-2 text-green-700">
              {success}
            </p>
          )}
          {gallery.error && (
            <div role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">
              {gallery.error}{' '}
              <button type="button" onClick={gallery.reload} className="font-semibold underline">
                Try again
              </button>
            </div>
          )}

          <div className="mt-4">
            {gallery.loading && media.length === 0 && !gallery.error && <SkeletonGrid label="Loading photos and videos..." />}

            {!gallery.loading && !gallery.error && pagination?.total === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
                {emptyMessage(type, 'No photos or videos in this album yet.')}
              </div>
            )}

            {media.length > 0 && (
              // Slightly faded while the next page loads, instead of blanking the grid
              <div className={gallery.loading ? 'opacity-60' : ''} aria-busy={gallery.loading}>
                <MediaGrid media={media} captionOf={(item) => item.original_filename} onOpen={gallery.openViewer} coverId={album.cover_media_id} />
              </div>
            )}

            {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />}
          </div>

          {gallery.viewerItem && (
            <MediaViewer
              media={gallery.viewerItem}
              position={gallery.position}
              onClose={gallery.closeViewer}
              onPrevious={gallery.showPrevious}
              onNext={gallery.showNext}
              isCover={album.cover_media_id === gallery.viewerItem.id}
              onToggleCover={canSetCover ? toggleCover : undefined}
              onDelete={canDelete ? deleteCurrent : undefined}
              busy={busy}
              message={result && !result.isError ? result.text : ''}
              error={result?.isError ? result.text : ''}
            />
          )}
        </>
      )}
    </section>
  )
}

export default AlbumDetailsPage
