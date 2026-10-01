import { isAxiosError } from 'axios'
import { useRef, useState, type DragEvent } from 'react'
import { uploadMedia } from '../services/mediaService'
import { getErrorMessage } from '../utils/apiError'
import { ACCEPTED_FILE_TYPES, checkFile, formatFileSize, getFileKind } from '../utils/mediaFiles'
import Alert from './ui/Alert'
import Button from './ui/Button'
import { cardClass } from './ui/Card'

// One selected file and how its upload is going
interface SelectedFile {
  file: File
  status: 'ready' | 'invalid' | 'uploading' | 'processing' | 'done' | 'failed'
  progress: number // 0-100, from the real upload request
  message: string // why it is invalid or failed
}

interface MediaUploaderProps {
  albumId: string
  onUploaded: () => void // called after uploads finish, so the page reloads the media list
}

// Upload panel for team members and admins: drag & drop or pick files, then upload them
// one by one. Each file is its own request, so each progress bar shows that file's real progress.
function MediaUploader({ albumId, onUploaded }: MediaUploaderProps) {
  const [selected, setSelected] = useState<SelectedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [summary, setSummary] = useState('') // "Media uploaded successfully." after a batch
  const inputRef = useRef<HTMLInputElement>(null)

  // Adds files from the picker or a drop, checking each one first
  function addFiles(files: FileList | null) {
    if (!files) return
    const added = Array.from(files).map((file): SelectedFile => {
      const problem = checkFile(file)
      return { file, status: problem ? 'invalid' : 'ready', progress: 0, message: problem }
    })
    setSelected((current) => [...current.filter((item) => item.status !== 'done'), ...added])
    setSummary('')
  }

  // Changes one file's entry in the list
  function updateFile(file: File, changes: Partial<SelectedFile>) {
    setSelected((current) => current.map((item) => (item.file === file ? { ...item, ...changes } : item)))
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault() // stop the browser from opening the file
    setDragging(false)
    if (!uploading) addFiles(event.dataTransfer.files)
  }

  async function handleUpload() {
    const toUpload = selected.filter((item) => item.status === 'ready' || item.status === 'failed')
    if (toUpload.length === 0) return
    setUploading(true)
    setSummary('')
    let uploadedCount = 0

    // One file at a time: simple, gentle on the server, and gives a real progress bar per file
    for (const { file } of toUpload) {
      updateFile(file, { status: 'uploading', progress: 0, message: '' })
      try {
        const result = await uploadMedia(albumId, [file], (percent) =>
          // 100% sent = our server now forwards it to Cloudinary, which takes a moment
          updateFile(file, percent < 100 ? { progress: percent } : { progress: 100, status: 'processing' }),
        )
        const failure = result.errors[0]
        updateFile(file, failure ? { status: 'failed', message: failure.message } : { status: 'done', progress: 100 })
        if (!failure) uploadedCount += 1
      } catch (err) {
        // The backend explains per-file problems in "errors"; otherwise use the usual messages
        const data = isAxiosError(err) ? (err.response?.data as { errors?: { message: string }[] } | undefined) : undefined
        updateFile(file, { status: 'failed', message: data?.errors?.[0]?.message ?? getErrorMessage(err) })
      }
    }

    setUploading(false)
    if (uploadedCount > 0) {
      setSummary(
        uploadedCount === toUpload.length
          ? 'Media uploaded successfully.'
          : `${uploadedCount} of ${toUpload.length} files uploaded. See the list for the files that failed.`,
      )
    }
    onUploaded()
  }

  const readyCount = selected.filter((item) => item.status === 'ready' || item.status === 'failed').length

  return (
    <section id="media-uploader" className={`p-4 sm:p-6 ${cardClass}`} aria-labelledby="uploader-heading">
      <h3 id="uploader-heading" className="text-lg font-semibold text-ink">
        Upload Photos/Videos
      </h3>

      {/* Drop zone: a plain <div> with the browser's drag & drop events, no extra library */}
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-3 rounded-lg border-2 border-dashed p-6 text-center ${
          dragging ? 'border-primary bg-primary-soft' : 'border-line'
        }`}
      >
        <p className="text-muted">Drag files here or</p>
        <Button variant="secondary" className="mt-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
          Select Photos/Videos
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
          data-testid="media-input"
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = '' // lets the same file be chosen again later
          }}
        />
        <p className="mt-2 text-sm text-muted">JPG, PNG, WEBP up to 10 MB · MP4, WEBM, MOV up to 100 MB</p>
      </div>

      {selected.length > 0 && (
        <ul className="mt-4 space-y-3">
          {selected.map((item, index) => (
            <li key={`${item.file.name}-${index}`} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 truncate font-medium">{item.file.name}</span>
                <span className="text-xs text-muted">
                  {getFileKind(item.file) ?? 'unsupported'} · {formatFileSize(item.file.size)}
                </span>
              </div>
              {/* Progress bar: its width is the real percentage sent */}
              <div className="mt-1 h-2 overflow-hidden rounded bg-gray-200">
                <div
                  className={`h-full ${item.status === 'failed' || item.status === 'invalid' ? 'bg-danger' : item.status === 'done' ? 'bg-success' : 'bg-primary'}`}
                  style={{ width: `${item.status === 'invalid' ? 100 : item.progress}%` }}
                />
              </div>
              <p
                className={`mt-1 text-xs ${item.status === 'failed' || item.status === 'invalid' ? 'text-danger' : 'text-muted'}`}
                data-status={item.status}
              >
                {item.status === 'ready' && 'Ready'}
                {item.status === 'uploading' && `Uploading ${item.progress}%`}
                {item.status === 'processing' && '100% sent · processing...'}
                {item.status === 'done' && 'Uploaded'}
                {(item.status === 'failed' || item.status === 'invalid') && item.message}
              </p>
            </li>
          ))}
        </ul>
      )}

      {summary && (
        <Alert tone={summary.startsWith('Media') ? 'success' : 'warning'} className="mt-4">
          {summary}
        </Alert>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleUpload} disabled={readyCount === 0} loading={uploading} loadingText="Uploading...">
          {`Upload${readyCount > 0 ? ` (${readyCount})` : ''}`}
        </Button>
        {selected.length > 0 && !uploading && (
          <Button
            variant="secondary"
            onClick={() => {
              setSelected([])
              setSummary('')
            }}
          >
            Clear list
          </Button>
        )}
      </div>
    </section>
  )
}

export default MediaUploader
