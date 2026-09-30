// Upload rules shown and checked in the browser. The backend checks them again (the real check).
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
export const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100 MB

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov']

// For the file picker, so it only offers allowed files
export const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov'

// 'image', 'video', or null when the file type is not allowed
export function getFileKind(file: File): 'image' | 'video' | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_EXTENSIONS.includes(extension) && file.type.startsWith('image/')) return 'image'
  if (VIDEO_EXTENSIONS.includes(extension) && file.type.startsWith('video/')) return 'video'
  return null
}

// A problem with the file ('' if it's fine to upload)
export function checkFile(file: File): string {
  const kind = getFileKind(file)
  if (!kind) return 'Unsupported file type'
  if (file.size === 0) return 'The file is empty'
  if (kind === 'image' && file.size > IMAGE_MAX_BYTES) return 'Images must be at most 10 MB'
  if (kind === 'video' && file.size > VIDEO_MAX_BYTES) return 'Videos must be at most 100 MB'
  return ''
}

// 1536000 -> "1.5 MB"
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Asks Cloudinary for a small, compressed version of an image for the grid, instead of
// downloading the full-size photo. Only changes real Cloudinary URLs ("/image/upload/").
export function thumbnailUrl(url: string): string {
  return url.replace('/image/upload/', '/image/upload/c_fill,w_400,h_300,q_auto,f_auto/')
}
