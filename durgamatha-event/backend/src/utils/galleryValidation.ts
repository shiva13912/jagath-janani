import type { CloudinaryResourceType } from '../config/cloudinary'
import { isValidUuid } from './eventValidation'

// Checks the query string of the gallery endpoints:
//   GET /api/albums/:albumId/media?page=1&limit=24&type=image
//   GET /api/media?eventId=...&albumId=...&type=video&page=2
//   GET /api/albums?search=diwali&eventId=...

export const DEFAULT_PAGE_SIZE = 24
export const MAX_PAGE_SIZE = 60 // nobody can ask for thousands of items at once
export const SEARCH_MAX_LENGTH = 100

export interface MediaQuery {
  page: number
  limit: number
  type: CloudinaryResourceType | null // null = photos and videos
  eventId: string | null
  albumId: string | null
}

export interface AlbumQuery {
  search: string | null
  eventId: string | null
}

type Result<T> = { data: T; errors: [] } | { data: null; errors: string[] }

// Express gives each query value as a string, a list (?page=1&page=2) or undefined.
// Only a single string is accepted; a list counts as invalid.
function readParam(query: Record<string, unknown>, name: string): string | undefined | null {
  const value = query[name]
  if (value === undefined) return undefined
  return typeof value === 'string' ? value : null
}

// Reads a whole positive number, e.g. "3". Returns null for "0", "-1", "2.5", "abc", "".
function readPositiveInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const number = Number(value)
  return number >= 1 && Number.isSafeInteger(number) ? number : null
}

function readId(query: Record<string, unknown>, name: string, label: string, errors: string[]): string | null {
  const value = readParam(query, name)
  if (value === undefined || value === '') return null
  if (value === null || !isValidUuid(value)) {
    errors.push(`${label} is not valid.`)
    return null
  }
  return value
}

export function validateMediaQuery(query: Record<string, unknown>): Result<MediaQuery> {
  const errors: string[] = []

  let page = 1
  const rawPage = readParam(query, 'page')
  if (rawPage !== undefined) {
    const value = rawPage === null ? null : readPositiveInteger(rawPage)
    if (value === null) errors.push('page must be a whole number of at least 1.')
    else page = value
  }

  let limit = DEFAULT_PAGE_SIZE
  const rawLimit = readParam(query, 'limit')
  if (rawLimit !== undefined) {
    const value = rawLimit === null ? null : readPositiveInteger(rawLimit)
    if (value === null || value > MAX_PAGE_SIZE) errors.push(`limit must be a whole number from 1 to ${MAX_PAGE_SIZE}.`)
    else limit = value
  }

  let type: CloudinaryResourceType | null = null
  const rawType = readParam(query, 'type')
  if (rawType !== undefined && rawType !== '') {
    if (rawType === 'image' || rawType === 'video') type = rawType
    else errors.push('type must be "image" or "video".')
  }

  const eventId = readId(query, 'eventId', 'eventId', errors)
  const albumId = readId(query, 'albumId', 'albumId', errors)

  if (errors.length > 0) return { data: null, errors }
  return { data: { page, limit, type, eventId, albumId }, errors: [] }
}

export function validateAlbumQuery(query: Record<string, unknown>): Result<AlbumQuery> {
  const errors: string[] = []

  let search: string | null = null
  const rawSearch = readParam(query, 'search')
  if (rawSearch === null) {
    errors.push('search must be text.')
  } else if (rawSearch !== undefined) {
    // Remove the characters that act as wildcards in a database pattern (% _ * \),
    // so "50%" is searched as plain text and can't match everything
    const cleaned = rawSearch.replace(/[%_*\\]/g, '').trim()
    if (cleaned.length > SEARCH_MAX_LENGTH) errors.push(`search must be at most ${SEARCH_MAX_LENGTH} characters.`)
    else search = cleaned || null
  }

  const eventId = readId(query, 'eventId', 'eventId', errors)

  if (errors.length > 0) return { data: null, errors }
  return { data: { search, eventId }, errors: [] }
}

// Checks the body of PUT /api/albums/:id/cover: { "media_id": "<uuid>" } or { "media_id": null }
export function validateCoverInput(body: unknown): Result<{ mediaId: string | null }> {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const value = input.media_id

  if (value === null) return { data: { mediaId: null }, errors: [] }
  if (typeof value === 'string' && isValidUuid(value)) return { data: { mediaId: value }, errors: [] }
  return { data: null, errors: ['media_id must be the id of a photo or video, or null to remove the cover.'] }
}
