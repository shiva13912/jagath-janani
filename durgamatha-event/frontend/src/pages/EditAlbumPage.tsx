import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import AlbumForm from '../components/AlbumForm'
import { getAlbumById, updateAlbum } from '../services/albumService'
import type { AlbumInput, AlbumWithDetails } from '../types/album'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'

// TEAM_MEMBER and ADMIN: edit an album's name and description.
// The event is shown but can't be changed, so the event relationship stays stable.
function EditAlbumPage({ basePath }: { basePath: string }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [album, setAlbum] = useState<AlbumWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAlbumById(id)
      .then(setAlbum)
      .catch((err) => setError(isNotFoundError(err) ? 'Album not found.' : getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(_eventId: string, data: AlbumInput) {
    try {
      await updateAlbum(id, data)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
    navigate(basePath)
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Edit Album</h1>

      {loading && <p className="text-gray-500">Loading album...</p>}

      {error && (
        <div>
          <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
          <Link to={basePath} className="mt-4 inline-block text-orange-600 hover:underline">
            ← Back to albums
          </Link>
        </div>
      )}

      {album && (
        <AlbumForm
          eventTitle={album.event?.title ?? 'Unknown event'}
          initialValues={{ eventId: album.event_id, name: album.name, description: album.description ?? '' }}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          cancelTo={basePath}
          onSubmit={handleSave}
        />
      )}
    </section>
  )
}

export default EditAlbumPage
