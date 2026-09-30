import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { deleteEvent, getEvents } from '../services/eventService'
import type { Event } from '../types/event'
import { getErrorMessage } from '../utils/apiError'
import { formatEventDate } from '../utils/date'

// ADMIN only: list of all events with Edit and Delete actions
function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // The event the admin clicked "Delete" on (shows the confirmation box)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Loads (or reloads) the list from the backend
  function loadEvents() {
    return getEvents()
      .then((list) => {
        setEvents(list)
        setError('')
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadEvents()
  }, [])

  async function confirmDelete() {
    if (!eventToDelete) return
    setDeleting(true)
    setSuccess('')
    try {
      await deleteEvent(eventToDelete.id)
      setEventToDelete(null)
      await loadEvents() // refresh the list first, so the message never shows next to the deleted event
      setSuccess(`"${eventToDelete.title}" was deleted.`)
    } catch (err) {
      setError(getErrorMessage(err))
      setEventToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <Link
          to="/admin/events/create"
          className="rounded bg-orange-600 px-4 py-2 text-center font-semibold text-white hover:bg-orange-700"
        >
          Create Event
        </Link>
      </div>

      {success && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-green-700">{success}</p>}
      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-gray-500">Loading events...</p>}
      {!loading && !error && events.length === 0 && (
        <p className="mt-6 text-gray-600">No events yet. Click "Create Event" to add one.</p>
      )}

      {events.length > 0 && (
        // overflow-x-auto lets the table scroll sideways on small phones
        <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Date</th>
                {/* Location is hidden on phones so the Actions column stays visible */}
                <th className="hidden px-4 py-3 md:table-cell">Location</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/events/${event.id}`} className="hover:text-orange-600">
                      {event.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatEventDate(event.event_date)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{event.location}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link to={`/admin/events/${event.id}/edit`} className="mr-3 text-orange-600 hover:underline">
                      Edit
                    </Link>
                    <button type="button" onClick={() => setEventToDelete(event)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation box: nothing is deleted until the admin clicks Delete here */}
      {eventToDelete && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Delete event?</h2>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete "{eventToDelete.title}"? This cannot be undone.
            </p>
            <p className="mt-2 text-sm text-gray-500">All albums of this event and all their photos and videos will be deleted too.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={deleting}
                className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminEventsPage
