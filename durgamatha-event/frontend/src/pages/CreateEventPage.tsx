import { useNavigate } from 'react-router'
import EventForm from '../components/EventForm'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { usePageTitle } from '../hooks/usePageTitle'
import { createEvent } from '../services/eventService'
import type { EventInput } from '../types/event'
import { getErrorMessage } from '../utils/apiError'

// ADMIN only: form to create a new event
function CreateEventPage() {
  usePageTitle('Create Event')
  const navigate = useNavigate()

  async function handleCreate(data: EventInput) {
    try {
      await createEvent(data)
    } catch (err) {
      // Give the form a friendly message to display
      throw new Error(getErrorMessage(err))
    }
    navigate('/admin/events', { state: { success: 'Event created successfully.' } })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Create Event" back={{ to: '/admin/events', label: 'Back to events' }} />
      <Card>
        <EventForm submitLabel="Create Event" submittingLabel="Creating..." onSubmit={handleCreate} />
      </Card>
    </div>
  )
}

export default CreateEventPage
