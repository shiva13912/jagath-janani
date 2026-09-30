import { useState } from 'react'
import type { Media } from '../types/media'
import { formatDuration, thumbnailUrl } from '../utils/mediaFiles'

interface MediaCardProps {
  media: Media
  caption: string // one short line under the picture (file name or album name)
  isCover?: boolean // shows a small "Cover" badge
  onOpen: () => void
}

// One square card in a gallery grid. The whole card is a button that opens the viewer.
// Only a small thumbnail is loaded (never the original file), and videos never play here.
function MediaCard({ media, caption, isCover = false, onOpen }: MediaCardProps) {
  const [failed, setFailed] = useState(false) // true if Cloudinary could not send the thumbnail
  const isVideo = media.resource_type === 'video'
  const label = `${isVideo ? 'Play video' : 'Open photo'}: ${media.original_filename}`

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      data-media-id={media.id} // lets the viewer give focus back to this card
      className="group block w-full overflow-hidden rounded-lg bg-white text-left shadow focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
    >
      <div className="relative aspect-square bg-gray-100">
        {failed ? (
          <div className="flex h-full items-center justify-center p-2 text-center text-sm text-gray-500">
            {isVideo ? 'Preview unavailable' : 'Image unavailable'}
          </div>
        ) : (
          // loading="lazy": the browser only downloads pictures that are about to scroll into view.
          // alt="": the button's aria-label already describes it, so screen readers don't read it twice.
          <img
            src={thumbnailUrl(media)}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}

        {isVideo && (
          <>
            {/* Play symbol in the middle, so videos are easy to spot */}
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 pl-1 text-xl text-white">
                ▶{'\uFE0E' /* show ▶ as a plain symbol, not a coloured emoji */}
              </span>
            </span>
            {media.duration !== null && (
              <span className="absolute right-2 bottom-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white" aria-hidden="true">
                {formatDuration(media.duration)}
              </span>
            )}
          </>
        )}

        {isCover && (
          <span className="absolute top-2 left-2 rounded bg-orange-600 px-1.5 py-0.5 text-xs font-semibold text-white">Cover</span>
        )}
      </div>
      <p className="truncate px-2 py-1.5 text-xs text-gray-600" title={caption}>
        {caption}
      </p>
    </button>
  )
}

export default MediaCard
