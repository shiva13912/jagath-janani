import { useState } from 'react'
import { Link } from 'react-router'
import type { AlbumWithCover } from '../types/album'
import { thumbnailUrl } from '../utils/mediaFiles'
import { buttonClass } from './ui/buttonStyles'
import { cardClass } from './ui/Card'

// One album card, used on the home page, the event page and in the gallery's Albums tab.
// The cover comes with the album from the API, so no extra request per card is needed.
function AlbumCard({ album, eventTitle }: { album: AlbumWithCover; eventTitle?: string }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const showCover = album.cover !== null && !coverFailed

  return (
    <article className={`flex flex-col overflow-hidden ${cardClass}`}>
      {showCover && album.cover ? (
        <img
          src={thumbnailUrl(album.cover)}
          alt={`Cover of ${album.name}`}
          loading="lazy"
          decoding="async"
          onError={() => setCoverFailed(true)}
          className="aspect-[4/3] w-full bg-gray-100 object-cover"
        />
      ) : (
        // Simple placeholder when no cover is chosen (or it could not be loaded)
        <div className="flex aspect-[4/3] items-center justify-center bg-primary-soft text-4xl text-orange-300" aria-hidden="true">
          ▣
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold break-words text-ink">{album.name}</h3>
        {eventTitle && <p className="text-sm text-muted">{eventTitle}</p>}
        {album.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{album.description}</p>}
        <div className="mt-auto pt-4">
          <Link to={`/albums/${album.id}`} aria-label={`View Album: ${album.name}`} className={buttonClass('secondary', 'sm')}>
            View Album
          </Link>
        </div>
      </div>
    </article>
  )
}

// Grey placeholder cards while albums load
export function AlbumCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Loading albums...</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`animate-pulse overflow-hidden ${cardClass}`}>
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlbumCard
