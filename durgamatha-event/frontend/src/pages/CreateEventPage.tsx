import { useNavigate } from 'react-router'
import EventForm from '../components/EventForm'
import { createEvent } from '../services/eventService'
import type { EventInput } from '../types/event'
import { getErrorMessage } from '../utils/apiError'

// ADMIN only: form to create a new event
function CreateEventPage() {
  const navigate = useNavigate()

  async function handleCreate(data: EventInput) {
    try {
      await createEvent(data)
    } catch (err) {
      // Give the form a friendly message to display
      throw new Error(getErrorMessage(err))
    }
    navigate('/admin/events')
  }

  return (
    <section className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
      <h1 className="mb-6 text-2xl font-bold">Create Event</h1>
      <EventForm submitLabel="Create Event" submittingLabel="Creating..." onSubmit={handleCreate} />
    </section>
  )
}

export default CreateEventPage
