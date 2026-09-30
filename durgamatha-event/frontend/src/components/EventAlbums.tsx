import { useEffect, useState } from 'react'
import AlbumCard from './AlbumCard'
import { getAlbumsByEvent } from '../services/albumService'
import type { AlbumWithCover } from '../types/album'
import { getErrorMessage } from '../utils/apiError'

// The "Albums" section shown under an event on the public event details page
function EventAlbums({ eventId }: { eventId: string }) {
  const [albums, setAlbums] = useState<AlbumWithCover[]>([])
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

      {/* 1 column on phones, 2 on tablets, 3 on laptops */}
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </section>
  )
}

export default EventAlbums
