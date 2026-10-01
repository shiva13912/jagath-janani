import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import EventForm from '../components/EventForm'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/StateMessages'
import { usePageTitle } from '../hooks/usePageTitle'
import { getEventById, updateEvent } from '../services/eventService'
import type { EventInput } from '../types/event'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'

// ADMIN only: load an existing event and edit it
function EditEventPage() {
  usePageTitle('Edit Event')
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
    navigate('/admin/events', { state: { success: 'Event updated successfully.' } })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit Event" back={{ to: '/admin/events', label: 'Back to events' }} />
      {loading && <LoadingState label="Loading event..." />}
      {error && <ErrorState message={error} />}
      {initialValues && (
        <Card>
          <EventForm initialValues={initialValues} submitLabel="Save Changes" submittingLabel="Saving..." onSubmit={handleSave} />
        </Card>
      )}
    </div>
  )
}

export default EditEventPage
