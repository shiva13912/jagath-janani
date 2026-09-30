import type { Media } from '../types/media'
import MediaCard from './MediaCard'

interface MediaGridProps<T extends Media> {
  media: T[]
  captionOf: (item: T) => string
  onOpen: (index: number) => void
  coverId?: string | null // the album's cover, marked with a badge
}

// The responsive grid used by the album page and the gallery:
// 2 columns on phones, 3 on tablets, 4 on laptops and 5 on large screens
function MediaGrid<T extends Media>({ media, captionOf, onOpen, coverId = null }: MediaGridProps<T>) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {media.map((item, index) => (
        <li key={item.id}>
          <MediaCard media={item} caption={captionOf(item)} isCover={item.id === coverId} onOpen={() => onOpen(index)} />
        </li>
      ))}
    </ul>
  )
}

export default MediaGrid
