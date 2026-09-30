import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getAlbumById } from '../services/albumService'
import type { AlbumWithDetails } from '../types/album'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { formatEventDate } from '../utils/date'

// Public page: one album and the event it belongs to
function AlbumDetailsPage() {
  const { albumId = '' } = useParams() // the :albumId part of the URL
  const [album, setAlbum] = useState<AlbumWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

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
    <section className="mx-auto max-w-3xl">
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

          {/* Placeholder until photos and videos arrive in Phase 5 */}
          <div className="mt-6 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
            No photos or videos have been added yet.
          </div>
        </>
      )}
    </section>
  )
}

export default AlbumDetailsPage
