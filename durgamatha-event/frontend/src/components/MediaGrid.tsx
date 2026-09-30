import type { Media } from '../types/media'
import { formatFileSize, thumbnailUrl } from '../utils/mediaFiles'

interface MediaGridProps {
  media: Media[]
  // Only given for admins: shows a Delete button on each item
  onDelete?: (item: Media) => void
}

// A simple grid of the album's photos and videos (the full gallery/viewer comes in Phase 6)
function MediaGrid({ media, onDelete }: MediaGridProps) {
  return (
    // 2 columns on phones, 3 on tablets and larger
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-lg bg-white shadow">
          <div className="aspect-[4/3] bg-gray-100">
            {item.resource_type === 'image' ? (
              // loading="lazy": the browser only downloads images that are about to scroll into view
              <img
                src={thumbnailUrl(item.secure_url)}
                alt={item.original_filename}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              // preload="metadata": only the first bytes (size, length) are loaded until the user presses play
              <video src={item.secure_url} controls preload="metadata" className="h-full w-full bg-black object-contain" />
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-500">
            <span className="truncate" title={item.original_filename}>
              {item.resource_type === 'video' ? 'Video' : 'Photo'} · {formatFileSize(item.file_size)}
            </span>
            {onDelete && (
              <button type="button" onClick={() => onDelete(item)} className="shrink-0 text-red-600 hover:underline">
                Delete
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default MediaGrid
