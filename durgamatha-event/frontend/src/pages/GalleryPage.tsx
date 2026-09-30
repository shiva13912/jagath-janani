import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import AlbumCard from '../components/AlbumCard'
import MediaGrid from '../components/MediaGrid'
import MediaViewer from '../components/MediaViewer'
import Pagination from '../components/Pagination'
import SkeletonGrid from '../components/SkeletonGrid'
import TypeFilter from '../components/TypeFilter'
import { usePagedMedia } from '../hooks/usePagedMedia'
import { getAlbums } from '../services/albumService'
import { getEvents } from '../services/eventService'
import { getGalleryMedia } from '../services/mediaService'
import type { AlbumWithDetails } from '../types/album'
import type { Event } from '../types/event'
import { getErrorMessage } from '../utils/apiError'
import { emptyMessage, readPage, readType } from '../utils/galleryParams'

// Public gallery (no login needed). Two tabs:
//   /gallery              Photos & Videos from every album, with event/album/type filters
//   /gallery?tab=albums   Album cards with their covers, searchable by name
// All filters are kept in the URL, so Back and shared links keep them.
function GalleryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'albums' ? 'albums' : 'media'

  // The events list fills the Event dropdowns (loaded once)
  const [events, setEvents] = useState<Event[]>([])
  const [eventsLoaded, setEventsLoaded] = useState(false)
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(() => setEvents([])) // the gallery still works without the dropdown's names
      .finally(() => setEventsLoaded(true))
  }, [])

  // Changes some URL parameters and keeps the others. A filter change goes back to page 1.
  const updateParams = useCallback(
    (changes: Record<string, string>) => {
      setSearchParams((params) => {
        const result = new URLSearchParams(params)
        if (!('page' in changes)) result.delete('page')
        for (const [key, value] of Object.entries(changes)) {
          // Default values are left out to keep the URL short
          if (!value || value === 'all' || (key === 'page' && value === '1')) result.delete(key)
          else result.set(key, value)
        }
        return result
      })
    },
    [setSearchParams],
  )

  const tabClass = (active: boolean) =>
    `rounded-t px-4 py-2 font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${
      active ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-600 hover:text-orange-600'
    }`

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold">Gallery</h1>
      <p className="mt-2 text-gray-600">Photos and videos from Durgamatha events.</p>

      <nav aria-label="Gallery views" className="mt-6 flex gap-2 border-b border-gray-200">
        <Link to="/gallery" aria-current={tab === 'media' ? 'page' : undefined} className={tabClass(tab === 'media')}>
          Photos &amp; Videos
        </Link>
        <Link to="/gallery?tab=albums" aria-current={tab === 'albums' ? 'page' : undefined} className={tabClass(tab === 'albums')}>
          Albums
        </Link>
      </nav>

      {tab === 'media' ? (
        <MediaTab events={events} eventsLoaded={eventsLoaded} searchParams={searchParams} updateParams={updateParams} />
      ) : (
        <AlbumsTab events={events} searchParams={searchParams} updateParams={updateParams} />
      )}
    </section>
  )
}

interface TabProps {
  events: Event[]
  searchParams: URLSearchParams
  updateParams: (changes: Record<string, string>) => void
}

const selectClass =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300'

// ---------------------------------------------------------------------------------------
// Photos & Videos tab
// ---------------------------------------------------------------------------------------
function MediaTab({ events, eventsLoaded, searchParams, updateParams }: TabProps & { eventsLoaded: boolean }) {
  const eventId = searchParams.get('event') ?? ''
  const albumId = searchParams.get('album') ?? ''
  const type = readType(searchParams.get('type'))
  const page = readPage(searchParams.get('page'))
  const hasFilters = Boolean(eventId || albumId || type !== 'all')

  // Albums for the Album dropdown: only the chosen event's albums, or all of them
  const [albums, setAlbums] = useState<AlbumWithDetails[]>([])
  useEffect(() => {
    let ignore = false
    getAlbums(eventId ? { eventId } : {})
      .then((list) => {
        if (!ignore) setAlbums(list)
      })
      .catch(() => {
        if (!ignore) setAlbums([])
      })
    return () => {
      ignore = true
    }
  }, [eventId])

  const setPage = useCallback((newPage: number) => updateParams({ page: String(newPage) }), [updateParams])
  const loadPage = useCallback(
    (pageNumber: number) => getGalleryMedia({ page: pageNumber, type, eventId, albumId }),
    [type, eventId, albumId],
  )
  const gallery = usePagedMedia(loadPage, page, setPage)
  const { media, pagination } = gallery

  let emptyText = emptyMessage(type, 'No photos or videos match these filters.')
  if (!hasFilters) emptyText = eventsLoaded && events.length === 0 ? 'No events available.' : 'No photos or videos have been added yet.'

  return (
    <div className="mt-6">
      {/* Filters: stacked on phones, side by side on bigger screens */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="gallery-event" className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select
            id="gallery-event"
            value={eventId}
            onChange={(e) => updateParams({ event: e.target.value, album: '' })} // a new event clears the album
            className={selectClass}
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="gallery-album" className="mb-1 block text-sm font-medium text-gray-700">
            Album
          </label>
          <select id="gallery-album" value={albumId} onChange={(e) => updateParams({ album: e.target.value })} className={selectClass}>
            <option value="">All Albums</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-sm font-medium text-gray-700">Type</span>
          <TypeFilter value={type} onChange={(value) => updateParams({ type: value })} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <p aria-live="polite">{pagination ? `${pagination.total} ${pagination.total === 1 ? 'item' : 'items'}` : ''}</p>
        {hasFilters && (
          <button type="button" onClick={() => updateParams({ event: '', album: '', type: '' })} className="font-semibold text-orange-600 hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {gallery.error && (
        <div role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">
          {gallery.error}{' '}
          <button type="button" onClick={gallery.reload} className="font-semibold underline">
            Try again
          </button>
        </div>
      )}

      <div className="mt-4">
        {gallery.loading && media.length === 0 && !gallery.error && <SkeletonGrid />}

        {!gallery.loading && !gallery.error && pagination?.total === 0 && (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">{emptyText}</div>
        )}

        {media.length > 0 && (
          <div className={gallery.loading ? 'opacity-60' : ''} aria-busy={gallery.loading}>
            <MediaGrid media={media} captionOf={(item) => item.album?.name ?? item.original_filename} onOpen={gallery.openViewer} />
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
          showAlbumLink
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------------------
// Albums tab
// ---------------------------------------------------------------------------------------
function AlbumsTab({ events, searchParams, updateParams }: TabProps) {
  const search = searchParams.get('q') ?? ''
  const eventId = searchParams.get('event') ?? ''
  const [searchText, setSearchText] = useState(search) // what is typed in the box right now

  const [albums, setAlbums] = useState<AlbumWithDetails[]>([])
  const [error, setError] = useState('')
  // The filters of the last answer. While they differ from the current ones, we are loading.
  const filterKey = `${search}|${eventId}`
  const [finishedKey, setFinishedKey] = useState<string | null>(null)
  const loading = finishedKey !== filterKey

  // Search 300 ms after the user stops typing, instead of on every key press
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim() !== search) updateParams({ q: searchText.trim() })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, search, updateParams])

  useEffect(() => {
    let ignore = false
    getAlbums({ search, eventId })
      .then((list) => {
        if (ignore) return
        setAlbums(list)
        setError('')
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setFinishedKey(`${search}|${eventId}`)
      })
    return () => {
      ignore = true
    }
  }, [search, eventId])

  return (
    <div className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="album-search" className="mb-1 block text-sm font-medium text-gray-700">
            Search albums
          </label>
          <input
            id="album-search"
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search albums..."
            maxLength={100}
            className={selectClass}
          />
        </div>
        <div>
          <label htmlFor="albums-event" className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select id="albums-event" value={eventId} onChange={(e) => updateParams({ event: e.target.value })} className={selectClass}>
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-red-700">
          {error}
        </p>
      )}
      {loading && albums.length === 0 && !error && (
        <p role="status" className="mt-4 text-gray-500">
          Loading albums...
        </p>
      )}
      {!loading && !error && albums.length === 0 && (
        <div className="mt-4 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
          {search ? `No albums match "${search}".` : 'No albums available.'}
        </div>
      )}

      {albums.length > 0 && (
        <div className={`mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} eventTitle={album.event?.title} />
          ))}
        </div>
      )}
    </div>
  )
}

export default GalleryPage
