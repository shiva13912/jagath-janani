import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import AlbumForm from '../components/AlbumForm'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { usePageTitle } from '../hooks/usePageTitle'
import { createAlbum } from '../services/albumService'
import { getEvents } from '../services/eventService'
import type { AlbumInput } from '../types/album'
import { getErrorMessage } from '../utils/apiError'

// TEAM_MEMBER and ADMIN: create a new album. basePath is "/admin/albums" or "/team/albums".
function CreateAlbumPage({ basePath }: { basePath: string }) {
  usePageTitle('Create Album')
  const navigate = useNavigate()
  // The events for the "Event" dropdown
  const { data: events, error, loading, reload } = useApiData(useCallback(() => getEvents(), []))

  async function handleCreate(eventId: string, data: AlbumInput) {
    try {
      await createAlbum(eventId, data)
    } catch (err) {
      // Give the form a friendly message to display
      throw new Error(getErrorMessage(err))
    }
    navigate(basePath, { state: { success: 'Album created successfully.' } })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create Album" back={{ to: basePath, label: 'Back to albums' }} />
      {loading && <LoadingState label="Loading events..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {events && events.length === 0 && (
        <EmptyState message="There are no events yet. An album must belong to an event, so an admin needs to create an event first." />
      )}
      {events && events.length > 0 && (
        <Card>
          <AlbumForm events={events} submitLabel="Create Album" submittingLabel="Creating..." cancelTo={basePath} onSubmit={handleCreate} />
        </Card>
      )}
    </div>
  )
}

export default CreateAlbumPage
