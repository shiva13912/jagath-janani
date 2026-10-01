import type { CloudinaryResourceType } from '../config/cloudinary'

// Thrown when a file is refused for a reason the user should see (wrong type, too big, ...)
export class FileRejectedError extends Error {}

// Upload limits (documented in the README). They match Cloudinary's free-plan limits.
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB per image
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100 MB per video
export const MAX_FILES_PER_UPLOAD = 10 // files per request

// Allowed file types: extension -> the MIME types browsers send for it
const IMAGE_TYPES: Record<string, string[]> = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
}
const VIDEO_TYPES: Record<string, string[]> = {
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  mov: ['video/quicktime'],
}

// Formats Cloudinary may report back after the upload (it reports JPEGs as "jpg")
export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp']
export const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov']

// Decides whether a file is an allowed image, an allowed video, or not allowed (null).
// Both the extension AND the MIME type must match, e.g. "photo.jpg" + "image/jpeg".
export function getFileKind(filename: string, mimeType: string): CloudinaryResourceType | null {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_TYPES[extension]?.includes(mimeType)) return 'image'
  if (VIDEO_TYPES[extension]?.includes(mimeType)) return 'video'
  return null
}

export function maxBytesFor(kind: CloudinaryResourceType): number {
  return kind === 'image' ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES
}

// Checks one uploaded file. Returns an error message, or '' if the file is fine.
export function validateMediaFile(filename: string, mimeType: string, size: number): string {
  const kind = getFileKind(filename, mimeType)
  if (!kind) return 'Unsupported file type. Allowed: JPG, JPEG, PNG, WEBP, MP4, WEBM, MOV.'
  if (size === 0) return 'The file is empty.'
  if (size > maxBytesFor(kind)) {
    return kind === 'image' ? 'Images must be at most 10 MB.' : 'Videos must be at most 100 MB.'
  }
  return ''
}
