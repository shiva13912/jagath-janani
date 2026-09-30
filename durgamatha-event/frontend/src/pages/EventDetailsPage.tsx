import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import EventAlbums from '../components/EventAlbums'
import { getEventById } from '../services/eventService'
import type { Event } from '../types/event'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { formatEventDate } from '../utils/date'

// Public page: the full details of one event
function EventDetailsPage() {
  const { eventId = '' } = useParams() // the :eventId part of the URL
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getEventById(eventId)
      .then(setEvent)
      .catch((err) => {
        if (isNotFoundError(err)) setNotFound(true)
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [eventId])

  return (
    <section className="mx-auto max-w-3xl">
      <Link to="/events" className="text-orange-600 hover:underline">
        ← Back to events
      </Link>

      {loading && <p className="mt-6 text-gray-500">Loading event...</p>}

      {notFound && (
        <div className="mt-6">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="mt-2 text-gray-600">This event does not exist or has been removed.</p>
        </div>
      )}

      {error && <p className="mt-6 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      {event && (
        <article className="mt-6 rounded-lg bg-white p-6 shadow">
          <h1 className="text-2xl font-bold md:text-3xl">{event.title}</h1>
          <dl className="mt-4 grid gap-4 text-gray-700 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="font-medium">{formatEventDate(event.event_date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Location</dt>
              <dd className="font-medium">{event.location}</dd>
            </div>
          </dl>
          {/* whitespace-pre-line keeps the line breaks the admin typed */}
          <p className="mt-6 whitespace-pre-line text-gray-800">{event.description}</p>
        </article>
      )}

      {/* Albums are loaded separately, once we know the event exists */}
      {event && <EventAlbums eventId={event.id} />}
    </section>
  )
}

export default EventDetailsPage
