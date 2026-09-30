import type { MediaTypeFilter } from '../types/media'

// Filters live in the URL (?page=2&type=video), so the Back button and shared links keep them.
// These helpers read them safely: anything invalid falls back to the default.

export function readPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function readType(value: string | null): MediaTypeFilter {
  return value === 'image' || value === 'video' ? value : 'all'
}

export const TYPE_OPTIONS: { value: MediaTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Photos' },
  { value: 'video', label: 'Videos' },
]

// The empty-state sentence for each type filter
export function emptyMessage(type: MediaTypeFilter, allMessage: string): string {
  if (type === 'image') return 'No photos found.'
  if (type === 'video') return 'No videos found.'
  return allMessage
}
