import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { MediaWithAlbum } from '../types/media'
import { formatTimestampDate } from '../utils/date'
import { downloadUrl, formatDuration, formatFileSize, videoPosterUrl, viewerImageUrl } from '../utils/mediaFiles'

interface MediaViewerProps {
  media: MediaWithAlbum
  position: string // e.g. "5 of 30"
  onClose: () => void
  onPrevious: (() => void) | null // null = there is no previous item
  onNext: (() => void) | null
  showAlbumLink?: boolean // the gallery links to the item's album
  // Team/admin actions. Leave them out and the buttons are not shown.
  isCover?: boolean
  onToggleCover?: () => void
  onDelete?: () => void
  busy?: boolean // an action is running: buttons are disabled
  message?: string // result of the last action, e.g. "Album cover updated."
  error?: string
}

// Fullscreen overlay ("lightbox") that shows one photo or plays one video.
// Keyboard: Esc closes, ← and → move to the previous/next item.
function MediaViewer({
  media,
  position,
  onClose,
  onPrevious,
  onNext,
  showAlbumLink = false,
  isCover = false,
  onToggleCover,
  onDelete,
  busy = false,
  message = '',
  error = '',
}: MediaViewerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [loaded, setLoaded] = useState(false) // photo finished loading
  const [failed, setFailed] = useState(false) // Cloudinary could not send the file
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  // A new item starts fresh: not loaded yet, no error, no open delete question.
  // (Resetting state while rendering is React's recommended way to react to a changed prop.)
  const [shownId, setShownId] = useState(media.id)
  if (shownId !== media.id) {
    setShownId(media.id)
    setLoaded(false)
    setFailed(false)
    setConfirmingDelete(false)
  }

  // Keyboard shortcuts. Kept in a ref so the listener always calls the latest functions.
  const keys = useRef({ onClose, onPrevious, onNext, confirmingDelete })
  const currentId = useRef(media.id) // the item on screen when the viewer closes
  useEffect(() => {
    keys.current = { onClose, onPrevious, onNext, confirmingDelete }
    currentId.current = media.id
  })

  useEffect(() => {
    // Remember what had focus (the card that was clicked) to give focus back when closing
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    // Stop the page behind the viewer from scrolling
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Esc first closes an open "Delete?" question, then the viewer itself
        if (keys.current.confirmingDelete) setConfirmingDelete(false)
        else keys.current.onClose()
        return
      }
      // A focused video uses the arrow keys itself (to skip forward/back)
      const onVideo = event.target instanceof HTMLVideoElement
      if (event.key === 'ArrowLeft' && !onVideo) keys.current.onPrevious?.()
      if (event.key === 'ArrowRight' && !onVideo) keys.current.onNext?.()

      // Keep Tab inside the viewer, so keyboard users don't end up on the page behind it
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), video[controls]')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = oldOverflow
      // Give focus back to the card of the item that was on screen (the viewer may have moved
      // to another item or page), or else to whatever had focus before
      const card = document.querySelector<HTMLElement>(`[data-media-id="${currentId.current}"]`)
      if (card) card.focus()
      else if (previouslyFocused?.isConnected) previouslyFocused.focus()
    }
  }, [])

  const isVideo = media.resource_type === 'video'
  const kind = isVideo ? 'Video' : 'Photo'

  // Only the facts that help a visitor; no internal ids
  const details = [
    kind,
    media.width && media.height ? `${media.width} × ${media.height}` : '',
    formatFileSize(media.file_size),
    media.duration !== null ? formatDuration(media.duration) : '',
    `Uploaded ${formatTimestampDate(media.created_at)}`,
  ].filter(Boolean)

  // On tablets and computers the arrows sit beside the photo. On phones they would cover it,
  // so there they move to the bottom bar instead.
  const navButtonClass =
    'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 sm:flex'
  const actionClass =
    'inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 disabled:opacity-60'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${kind} viewer: ${media.original_filename}`}
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white"
    >
      {/* Top bar: name, position and a large Close button */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{media.original_filename}</p>
          <p className="text-sm text-gray-300">{position}</p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl hover:bg-white/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
        >
          ✕
        </button>
      </div>

      {/* The photo or video, always fitted inside the screen */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
        {onPrevious && (
          <button type="button" onClick={onPrevious} aria-label="Previous" className={`${navButtonClass} left-2`}>
            ‹
          </button>
        )}

        {failed ? (
          <p role="alert" className="rounded bg-white/10 px-4 py-3 text-center">
            {isVideo
              ? 'This video could not be played here. You can still download it below.'
              : 'This photo could not be loaded. Please try again later.'}
          </p>
        ) : isVideo ? (
          // key: a new <video> for each item, so the previous one stops playing.
          // No autoplay: it only plays when the visitor presses play.
          <video
            key={media.id}
            src={media.secure_url}
            poster={videoPosterUrl(media.secure_url)}
            controls
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
            className="max-h-full max-w-full"
          >
            Your browser cannot play this video.
          </video>
        ) : (
          <>
            {!loaded && (
              <p role="status" className="absolute text-gray-300">
                Loading photo...
              </p>
            )}
            <img
              key={media.id}
              src={viewerImageUrl(media.secure_url)}
              alt={media.original_filename}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className="max-h-full max-w-full object-contain"
            />
          </>
        )}

        {onNext && (
          <button type="button" onClick={onNext} aria-label="Next" className={`${navButtonClass} right-2`}>
            ›
          </button>
        )}
      </div>

      {/* Bottom bar: details and actions */}
      <div className="space-y-3 px-4 py-3">
        <p className="text-sm text-gray-300">
          {details.join(' · ')}
          {showAlbumLink && media.album && (
            <>
              {' · '}
              <Link to={`/albums/${media.album.id}`} className="text-orange-300 underline hover:text-orange-200">
                {media.album.name}
              </Link>
            </>
          )}
        </p>

        {message && (
          <p role="status" className="text-sm text-green-300">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}

        {confirmingDelete ? (
          <div className="rounded-lg bg-white p-4 text-ink" role="alertdialog" aria-label="Confirm delete">
            <p className="font-semibold">Are you sure you want to delete this media?</p>
            <p className="mt-1 text-sm text-gray-600">
              "{media.original_filename}" will be removed from Cloudinary and from the album. This cannot be undone.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className={`${actionClass} border border-line text-ink`}
              >
                Cancel
              </button>
              <button type="button" onClick={onDelete} disabled={busy} className={`${actionClass} bg-danger text-white hover:bg-red-800`}>
                {busy ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Previous / Next for phones (hidden from tablet size up, where the side arrows show) */}
            <div className="flex w-full gap-2 sm:hidden">
              <button
                type="button"
                onClick={onPrevious ?? undefined}
                disabled={!onPrevious}
                aria-label="Previous"
                className={`${actionClass} flex-1 bg-white/15 hover:bg-white/30`}
              >
                ‹ Previous
              </button>
              <button type="button" onClick={onNext ?? undefined} disabled={!onNext} aria-label="Next" className={`${actionClass} flex-1 bg-white/15 hover:bg-white/30`}>
                Next ›
              </button>
            </div>
            {/* A normal link: the file comes straight from Cloudinary, not through our server */}
            <a href={downloadUrl(media)} download className={`${actionClass} bg-primary text-white hover:bg-primary-hover`}>
              Download
            </a>
            {onToggleCover && (
              <button type="button" onClick={onToggleCover} disabled={busy} className={`${actionClass} bg-white/15 hover:bg-white/30`}>
                {isCover ? 'Remove as album cover' : 'Set as album cover'}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={busy}
                className={`${actionClass} bg-red-600/80 hover:bg-red-600`}
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className={`${actionClass} bg-white/15 hover:bg-white/30`}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaViewer
