import { useState } from 'react'
import { Link } from 'react-router'
import type { AlbumWithCover } from '../types/album'
import { thumbnailUrl } from '../utils/mediaFiles'

// One album card, used on the event page and in the gallery's Albums tab.
// The cover comes with the album from the API, so no extra request per card is needed.
function AlbumCard({ album, eventTitle }: { album: AlbumWithCover; eventTitle?: string }) {
  const [coverFailed, setCoverFailed] = useState(false)
  const showCover = album.cover !== null && !coverFailed

  return (
    <article className="flex flex-col overflow-hidden rounded-lg bg-white shadow">
      {showCover && album.cover ? (
        <img
          src={thumbnailUrl(album.cover)}
          alt={`Cover of ${album.name}`}
          loading="lazy"
          decoding="async"
          onError={() => setCoverFailed(true)}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        // Simple placeholder when no cover is chosen (or it could not be loaded)
        <div className="flex aspect-[4/3] items-center justify-center bg-orange-50 text-4xl text-orange-300" aria-hidden="true">
          ▣
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">{album.name}</h3>
        {eventTitle && <p className="text-sm text-gray-500">{eventTitle}</p>}
        {album.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{album.description}</p>}
        <Link
          to={`/albums/${album.id}`}
          aria-label={`View Album: ${album.name}`}
          className="mt-3 self-start text-sm font-semibold text-orange-600 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300"
        >
          View Album
        </Link>
      </div>
    </article>
  )
}

export default AlbumCard
