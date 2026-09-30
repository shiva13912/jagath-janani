import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import EventForm from '../components/EventForm'
import { getEventById, updateEvent } from '../services/eventService'
import type { EventInput } from '../types/event'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'

// ADMIN only: load an existing event and edit it
function EditEventPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [initialValues, setInitialValues] = useState<EventInput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getEventById(id)
      // Only the editable fields go into the form
      .then((event) =>
        setInitialValues({
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
        }),
      )
      .catch((err) => setError(isNotFoundError(err) ? 'Event not found.' : getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(data: EventInput) {
    try {
      await updateEvent(id, data)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
    navigate('/admin/events')
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Edit Event</h1>

      {loading && <p className="text-gray-500">Loading event...</p>}

      {error && (
        <div>
          <p className="rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>
          <Link to="/admin/events" className="mt-4 inline-block text-orange-600 hover:underline">
            ← Back to events
          </Link>
        </div>
      )}

      {initialValues && (
        <EventForm
          initialValues={initialValues}
          submitLabel="Save Changes"
          submittingLabel="Saving..."
          onSubmit={handleSave}
        />
      )}
    </section>
  )
}

export default EditEventPage
