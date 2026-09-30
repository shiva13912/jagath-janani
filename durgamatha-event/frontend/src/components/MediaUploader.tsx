import { isAxiosError } from 'axios'
import { useRef, useState, type DragEvent } from 'react'
import { uploadMedia } from '../services/mediaService'
import { getErrorMessage } from '../utils/apiError'
import { ACCEPTED_FILE_TYPES, checkFile, formatFileSize, getFileKind } from '../utils/mediaFiles'

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
  const inputRef = useRef<HTMLInputElement>(null)

  // Adds files from the picker or a drop, checking each one first
  function addFiles(files: FileList | null) {
    if (!files) return
    const added = Array.from(files).map((file): SelectedFile => {
      const problem = checkFile(file)
      return { file, status: problem ? 'invalid' : 'ready', progress: 0, message: problem }
    })
    setSelected((current) => [...current.filter((item) => item.status !== 'done'), ...added])
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
      } catch (err) {
        // The backend explains per-file problems in "errors"; otherwise use the usual messages
        const data = isAxiosError(err) ? (err.response?.data as { errors?: { message: string }[] } | undefined) : undefined
        updateFile(file, { status: 'failed', message: data?.errors?.[0]?.message ?? getErrorMessage(err) })
      }
    }

    setUploading(false)
    onUploaded()
  }

  const readyCount = selected.filter((item) => item.status === 'ready' || item.status === 'failed').length

  return (
    <section className="mt-6 rounded-lg bg-white p-4 shadow sm:p-6">
      <h2 className="text-lg font-semibold">Upload Photos/Videos</h2>

      {/* Drop zone: a plain <div> with the browser's drag & drop events, no extra library */}
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-3 rounded-lg border-2 border-dashed p-6 text-center ${
          dragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
        }`}
      >
        <p className="text-gray-600">Drag files here or</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-2 rounded border border-orange-600 px-4 py-2 font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-60"
        >
          Select Photos/Videos
        </button>
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
        <p className="mt-2 text-xs text-gray-500">JPG, PNG, WEBP up to 10 MB · MP4, WEBM, MOV up to 100 MB</p>
      </div>

      {selected.length > 0 && (
        <ul className="mt-4 space-y-3">
          {selected.map((item, index) => (
            <li key={`${item.file.name}-${index}`} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="min-w-0 truncate font-medium">{item.file.name}</span>
                <span className="text-xs text-gray-500">
                  {getFileKind(item.file) ?? 'unsupported'} · {formatFileSize(item.file.size)}
                </span>
              </div>
              {/* Progress bar: its width is the real percentage sent */}
              <div className="mt-1 h-2 overflow-hidden rounded bg-gray-200">
                <div
                  className={`h-full ${item.status === 'failed' || item.status === 'invalid' ? 'bg-red-500' : item.status === 'done' ? 'bg-green-600' : 'bg-orange-500'}`}
                  style={{ width: `${item.status === 'invalid' ? 100 : item.progress}%` }}
                />
              </div>
              <p
                className={`mt-1 text-xs ${item.status === 'failed' || item.status === 'invalid' ? 'text-red-600' : 'text-gray-500'}`}
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || readyCount === 0}
          className="rounded bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : `Upload${readyCount > 0 ? ` (${readyCount})` : ''}`}
        </button>
        {selected.length > 0 && !uploading && (
          <button
            type="button"
            onClick={() => setSelected([])}
            className="rounded border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50"
          >
            Clear list
          </button>
        )}
      </div>
    </section>
  )
}

export default MediaUploader
