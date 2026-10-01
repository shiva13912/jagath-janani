import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import MediaGrid from '../components/MediaGrid'
import MediaUploader from '../components/MediaUploader'
import MediaViewer from '../components/MediaViewer'
import Pagination from '../components/Pagination'
import SkeletonGrid from '../components/SkeletonGrid'
import TypeFilter from '../components/TypeFilter'
import Alert from '../components/ui/Alert'
import Button, { ButtonLink } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { BackLink } from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { usePageTitle } from '../hooks/usePageTitle'
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
  const [attempt, setAttempt] = useState(0) // "Try again" loads the album once more
  const [showUploader, setShowUploader] = useState(false)
  usePageTitle(album?.name ?? (notFound ? 'Album not found' : 'Album'))

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
  }, [albumId, attempt])

  function retry() {
    setError('')
    setLoading(true)
    setAttempt((n) => n + 1)
  }

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
      setSuccess(`Media deleted successfully. ("${item.original_filename}")`)
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
      <BackLink to={backLink} label={event ? `Back to ${event.title}` : 'Back to events'} />

      {loading && <LoadingState label="Loading album..." />}

      {notFound && (
        <div className="py-10 text-center">
          <h1 className="text-2xl font-bold text-ink">Album not found</h1>
          <p className="mt-2 text-muted">This album does not exist or has been removed.</p>
          <ButtonLink to="/gallery" className="mt-6">
            Browse the gallery
          </ButtonLink>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={retry} className="mt-4" />}

      {album && (
        <>
          <Card className="mt-2">
            <h1 className="text-2xl font-bold tracking-tight break-words text-ink md:text-3xl">{album.name}</h1>
            {album.description && <p className="mt-3 leading-relaxed whitespace-pre-line text-ink">{album.description}</p>}

            {event && (
              <dl className="mt-5 grid gap-4 rounded-lg bg-page p-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-muted">Event</dt>
                  <dd className="font-medium">
                    <Link to={`/events/${event.id}`} className="text-primary underline-offset-2 hover:underline">
                      {event.title}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Date</dt>
                  <dd className="font-medium text-ink">{formatEventDate(event.event_date)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Location</dt>
                  <dd className="font-medium break-words text-ink">{event.location}</dd>
                </div>
              </dl>
            )}
          </Card>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">
              Photos &amp; Videos
              {pagination && pagination.total > 0 && <span className="ml-2 text-base font-normal text-muted">({pagination.total})</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <TypeFilter value={type} onChange={(value) => changeFilters({ type: value })} />
              {/* Management: only team members and admins see this button (the backend checks again) */}
              {canUpload && (
                <Button
                  size="sm"
                  variant={showUploader ? 'secondary' : 'primary'}
                  aria-expanded={showUploader}
                  aria-controls="media-uploader"
                  onClick={() => setShowUploader((open) => !open)}
                >
                  {showUploader ? 'Close upload' : '+ Upload'}
                </Button>
              )}
            </div>
          </div>

          {/* The upload panel opens under the heading, so the photos stay the first thing visitors see */}
          {canUpload && showUploader && (
            <div className="mt-4">
              <MediaUploader albumId={album.id} onUploaded={handleUploaded} />
            </div>
          )}

          {success && (
            <Alert tone="success" className="mt-4">
              {success}
            </Alert>
          )}
          {gallery.error && <ErrorState message={gallery.error} onRetry={gallery.reload} className="mt-4" />}

          <div className="mt-4">
            {gallery.loading && media.length === 0 && !gallery.error && <SkeletonGrid label="Loading photos and videos..." />}

            {!gallery.loading && !gallery.error && pagination?.total === 0 && (
              <EmptyState message={emptyMessage(type, 'No photos or videos in this album yet.')}>
                {canUpload && !showUploader && (
                  <Button size="sm" onClick={() => setShowUploader(true)}>
                    Upload Photos/Videos
                  </Button>
                )}
              </EmptyState>
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
