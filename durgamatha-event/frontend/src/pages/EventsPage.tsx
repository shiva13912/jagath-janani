import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getEvents } from '../services/eventService'
import type { Event } from '../types/event'
import { getErrorMessage } from '../utils/apiError'
import { formatEventDate } from '../utils/date'

// Shortens long descriptions for the list (the details page shows the full text)
function shorten(text: string, maxLength = 150): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text
}

// Public page: anyone can see the list of events
function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the events once when the page opens
  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section>
      <h1 className="text-2xl font-bold md:text-3xl">Events</h1>

      {loading && <p className="mt-6 text-gray-500">Loading events...</p>}

      {error && <p className="mt-6 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p className="mt-6 text-gray-600">No events available yet.</p>
      )}

      {/* 1 column on phones, 2 on tablets, 3 on large screens */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <article key={event.id} className="flex flex-col rounded-lg bg-white p-5 shadow">
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatEventDate(event.event_date)} · {event.location}
            </p>
            <p className="mt-3 flex-1 text-gray-700">{shorten(event.description)}</p>
            <Link
              to={`/events/${event.id}`}
              className="mt-4 inline-block self-start rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              View Details
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default EventsPage
