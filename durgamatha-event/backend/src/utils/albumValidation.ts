import type { AlbumInput } from '../types/album'

export const ALBUM_NAME_MAX_LENGTH = 150
export const ALBUM_DESCRIPTION_MAX_LENGTH = 2000

// Result of checking a request body: either clean data, or a list of problems
type ValidationResult = { data: AlbumInput; errors: [] } | { data: null; errors: string[] }

// Checks the body of POST /api/events/:eventId/albums and PUT /api/albums/:id.
// Only name and description are read; id, event_id, created_by, created_at, ...
// in the body are ignored, so the client cannot set them.
export function validateAlbumInput(body: unknown): ValidationResult {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const rawDescription = input.description

  const errors: string[] = []
  if (!name) errors.push('Name is required.')
  else if (name.length > ALBUM_NAME_MAX_LENGTH) errors.push(`Name must be at most ${ALBUM_NAME_MAX_LENGTH} characters.`)

  // Description is optional: missing, null or blank all mean "no description" (stored as NULL)
  let description: string | null = null
  if (rawDescription !== undefined && rawDescription !== null) {
    if (typeof rawDescription !== 'string') {
      errors.push('Description must be text.')
    } else if (rawDescription.trim().length > ALBUM_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description must be at most ${ALBUM_DESCRIPTION_MAX_LENGTH} characters.`)
    } else {
      description = rawDescription.trim() || null
    }
  }

  if (errors.length > 0) return { data: null, errors }
  return { data: { name, description }, errors: [] }
}
