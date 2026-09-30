import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getAlbumsByEvent } from '../services/albumService'
import type { Album } from '../types/album'
import { getErrorMessage } from '../utils/apiError'

// The "Albums" section shown under an event on the public event details page
function EventAlbums({ eventId }: { eventId: string }) {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAlbumsByEvent(eventId)
      .then(setAlbums)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Albums</h2>

      {loading && <p className="mt-3 text-gray-500">Loading albums...</p>}
      {error && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {!loading && !error && albums.length === 0 && (
        <p className="mt-3 text-gray-600">No albums available for this event yet.</p>
      )}

      {/* 1 column on phones, 2 on tablets and larger */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {albums.map((album) => (
          <article key={album.id} className="flex flex-col overflow-hidden rounded-lg bg-white shadow">
            {/* Placeholder instead of a cover image: real covers come with media in Phase 5 */}
            <div className="flex h-28 items-center justify-center bg-orange-50 text-3xl text-orange-300" aria-hidden="true">
              ▣
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold">{album.name}</h3>
              {album.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{album.description}</p>}
              <Link
                to={`/albums/${album.id}`}
                className="mt-3 self-start text-sm font-semibold text-orange-600 hover:underline"
              >
                View Album
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default EventAlbums
