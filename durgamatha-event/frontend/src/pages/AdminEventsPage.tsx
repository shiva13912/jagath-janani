import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import Alert from '../components/ui/Alert'
import Button, { ButtonLink } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import ResponsiveTable, { SkeletonTable } from '../components/ui/ResponsiveTable'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { useFlashMessage } from '../hooks/useFlashMessage'
import { usePageTitle } from '../hooks/usePageTitle'
import { deleteEvent, getEvents } from '../services/eventService'
import type { Event } from '../types/event'
import { getErrorMessage } from '../utils/apiError'
import { formatEventDate } from '../utils/date'

// ADMIN only: list of all events with Edit and Delete actions
function AdminEventsPage() {
  usePageTitle('Manage Events')
  const { data: events, error, loading, reload } = useApiData(useCallback(() => getEvents(), []))
  const [success, setSuccess] = useFlashMessage() // e.g. "Event created successfully."
  const [actionError, setActionError] = useState('')
  // The event the admin clicked "Delete" on (shows the confirmation box)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!eventToDelete) return
    setDeleting(true)
    setSuccess('')
    setActionError('')
    try {
      await deleteEvent(eventToDelete.id)
      setSuccess(`Event deleted successfully. ("${eventToDelete.title}")`)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setEventToDelete(null)
    }
  }

  return (
    <section>
      <PageHeader title="Manage Events" subtitle="Create, edit and delete events." actions={<ButtonLink to="/admin/events/create">+ Create Event</ButtonLink>} />

      {success && (
        <Alert tone="success" className="mb-4">
          {success}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}

      {loading && <SkeletonTable label="Loading events..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {events && events.length === 0 && (
        <EmptyState message="No events yet.">
          <ButtonLink to="/admin/events/create">Create Event</ButtonLink>
        </EmptyState>
      )}

      {events && events.length > 0 && (
        <ResponsiveTable
          caption="Events"
          rows={events}
          rowKey={(event) => event.id}
          columns={[
            {
              header: 'Event',
              cell: (event) => (
                <Link to={`/events/${event.id}`} className="text-ink underline-offset-2 hover:text-primary hover:underline">
                  {event.title}
                </Link>
              ),
            },
            { header: 'Date', cell: (event) => <span className="whitespace-nowrap">{formatEventDate(event.event_date)}</span> },
            { header: 'Location', cell: (event) => event.location, hideBelow: 'lg' },
          ]}
          actions={(event) => (
            <>
              <ButtonLink to={`/admin/events/${event.id}/edit`} variant="secondary" size="sm" aria-label={`Edit ${event.title}`}>
                Edit
              </ButtonLink>
              <Button variant="danger" size="sm" onClick={() => setEventToDelete(event)} aria-label={`Delete ${event.title}`}>
                Delete
              </Button>
            </>
          )}
        />
      )}

      {/* Confirmation box: nothing is deleted until the admin clicks Delete here */}
      {eventToDelete && (
        <ConfirmDialog
          title="Delete event?"
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setEventToDelete(null)}
        >
          <p>Are you sure you want to delete "{eventToDelete.title}"? This cannot be undone.</p>
          <p className="text-sm">
            All albums of this event and all their photos and videos will be deleted too, and so will all of its income and expense records.
          </p>
        </ConfirmDialog>
      )}
    </section>
  )
}

export default AdminEventsPage
