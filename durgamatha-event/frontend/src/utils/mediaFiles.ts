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

// ---------------------------------------------------------------------------------------
// Cloudinary delivery URLs
//
// A Cloudinary URL looks like:
//   https://res.cloudinary.com/<cloud>/image/upload/v1712345678/durgamatha/.../abc123.jpg
// Putting "transformation" settings right after "/upload/" asks Cloudinary for a changed
// version of the SAME file, e.g. ".../image/upload/c_fill,w_400,h_400,q_auto,f_auto/v1712.../abc123.jpg".
// Cloudinary makes that version once and caches it. The original stays untouched, and the
// secure_url saved in our database is never changed: these URLs are only built for display.
//
//   c_fill,w_400,h_400  crop/resize to exactly 400x400 pixels (fills the square card)
//   c_limit,w_1600      shrink to at most 1600 px wide, never enlarge
//   q_auto              Cloudinary picks a good compression quality
//   f_auto              Cloudinary picks the best format for the browser (e.g. WebP)
//   so_0                (videos) take the frame at 0 seconds...
//   .jpg                ...and send it as a JPG picture instead of the video
//   fl_attachment       send the original file as a download ("Save as") instead of showing it
// ---------------------------------------------------------------------------------------

// Inserts transformation settings after "/image/upload/" or "/video/upload/".
// URLs that are not Cloudinary delivery URLs are returned unchanged.
function withTransformation(url: string, transformation: string): string {
  return url.replace(/\/(image|video)\/upload\//, `/$1/upload/${transformation}/`)
}

// Replaces the file extension at the end of the URL, e.g. ".mp4" -> ".jpg"
function withExtension(url: string, extension: string): string {
  return url.replace(/\.\w+$/, `.${extension}`)
}

// Small square picture for grid cards: a resized photo, or a still frame of a video
export function thumbnailUrl(media: { secure_url: string; resource_type: 'image' | 'video' }): string {
  if (media.resource_type === 'video') {
    return withExtension(withTransformation(media.secure_url, 'so_0,c_fill,w_400,h_400,q_auto'), 'jpg')
  }
  return withTransformation(media.secure_url, 'c_fill,w_400,h_400,q_auto,f_auto')
}

// Photo shown in the fullscreen viewer: big enough for any screen, but not the original
export function viewerImageUrl(secureUrl: string): string {
  return withTransformation(secureUrl, 'c_limit,w_1600,h_1600,q_auto,f_auto')
}

// Still frame shown before a video starts playing in the viewer
export function videoPosterUrl(secureUrl: string): string {
  return withExtension(withTransformation(secureUrl, 'so_0,c_limit,w_1600,q_auto'), 'jpg')
}

// Download link for the ORIGINAL file. The browser downloads it straight from Cloudinary
// (never through our server). "fl_attachment:<name>" also sets the file name,
// e.g. "fl_attachment:puja_night" -> puja_night.jpg. Only letters, digits, - and _ are allowed.
export function downloadUrl(media: { secure_url: string; original_filename: string }): string {
  const name = media.original_filename
    .replace(/\.\w+$/, '') // drop the extension; Cloudinary adds the real one
    .replace(/[^A-Za-z0-9_-]+/g, '_') // "Puja night (1)" -> "Puja_night_1_"
    .replace(/^_+|_+$/g, '') // -> "Puja_night_1"
    .slice(0, 60)
  return withTransformation(media.secure_url, name ? `fl_attachment:${name}` : 'fl_attachment')
}

// 42 -> "0:42", 125.4 -> "2:05", 3725 -> "1:02:05"
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = String(total % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`
}
