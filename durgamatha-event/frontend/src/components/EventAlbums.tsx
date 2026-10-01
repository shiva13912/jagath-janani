import { useCallback } from 'react'
import { useApiData } from '../hooks/useApiData'
import { getAlbumsByEvent } from '../services/albumService'
import AlbumCard, { AlbumCardSkeleton } from './AlbumCard'
import { SectionTitle } from './ui/PageHeader'
import { EmptyState, ErrorState } from './ui/StateMessages'

// The "Albums" section shown under an event on the public event details page
function EventAlbums({ eventId }: { eventId: string }) {
  const { data: albums, error, loading, reload } = useApiData(useCallback(() => getAlbumsByEvent(eventId), [eventId]))

  return (
    <section className="mt-10" aria-labelledby="event-albums-heading">
      <SectionTitle id="event-albums-heading">Albums</SectionTitle>
      <div className="mt-4">
        {loading && <AlbumCardSkeleton count={3} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {albums && albums.length === 0 && <EmptyState message="No albums available for this event yet." />}
        {albums && albums.length > 0 && (
          // 1 column on phones, 2 on tablets, 3 on laptops
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default EventAlbums
