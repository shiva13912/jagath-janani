import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import AlbumForm from '../components/AlbumForm'
import { createAlbum } from '../services/albumService'
import { getEvents } from '../services/eventService'
import type { AlbumInput } from '../types/album'
import type { Event } from '../types/event'
import { getErrorMessage } from '../utils/apiError'

// TEAM_MEMBER and ADMIN: create a new album. basePath is "/admin/albums" or "/team/albums".
function CreateAlbumPage({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the events for the "Event" dropdown
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(eventId: string, data: AlbumInput) {
    try {
      await createAlbum(eventId, data)
    } catch (err) {
      // Give the form a friendly message to display
      throw new Error(getErrorMessage(err))
    }
    navigate(basePath)
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Create Album</h1>

      {loading && <p className="text-gray-500">Loading events...</p>}
      {error && <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="text-gray-600">There are no events yet. An album must belong to an event, so an admin needs to create an event first.</p>
      )}

      {events.length > 0 && (
        <AlbumForm
          events={events}
          submitLabel="Create Album"
          submittingLabel="Creating..."
          cancelTo={basePath}
          onSubmit={handleCreate}
        />
      )}
    </section>
  )
}

export default CreateAlbumPage
