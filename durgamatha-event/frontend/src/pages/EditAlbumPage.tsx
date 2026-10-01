import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AlbumForm from '../components/AlbumForm'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/StateMessages'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAlbumById, updateAlbum } from '../services/albumService'
import type { AlbumInput, AlbumWithDetails } from '../types/album'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'

// TEAM_MEMBER and ADMIN: edit an album's name and description.
// The event is shown but can't be changed, so the event relationship stays stable.
function EditAlbumPage({ basePath }: { basePath: string }) {
  usePageTitle('Edit Album')
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
    navigate(basePath, { state: { success: 'Album updated successfully.' } })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit Album" back={{ to: basePath, label: 'Back to albums' }} />
      {loading && <LoadingState label="Loading album..." />}
      {error && <ErrorState message={error} />}
      {album && (
        <Card>
          <AlbumForm
            eventTitle={album.event?.title ?? 'Unknown event'}
            initialValues={{ eventId: album.event_id, name: album.name, description: album.description ?? '' }}
            submitLabel="Save Changes"
            submittingLabel="Saving..."
            cancelTo={basePath}
            onSubmit={handleSave}
          />
        </Card>
      )}
    </div>
  )
}

export default EditAlbumPage
