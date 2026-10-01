import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import EventAlbums from '../components/EventAlbums'
import EventFinanceSection from '../components/EventFinanceSection'
import Badge from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import Card from '../components/ui/Card'
import { BackLink } from '../components/ui/PageHeader'
import { LoadingState } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/StateMessages'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { getEventById } from '../services/eventService'
import type { Event } from '../types/event'
import { getErrorMessage, isNotFoundError } from '../utils/apiError'
import { formatEventDate, todayString } from '../utils/date'
import { hasRole, TEAM_ROLES } from '../utils/roles'

// Public page: the full details of one event.
// Team members and admins also see the event's income, expenses and balance
// (public visitors never do, and the backend refuses them anyway).
function EventDetailsPage() {
  const { eventId = '' } = useParams() // the :eventId part of the URL
  const { profile } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0) // "Try again" loads the event once more
  usePageTitle(event?.title ?? (notFound ? 'Event not found' : 'Event'))

  useEffect(() => {
    getEventById(eventId)
      .then(setEvent)
      .catch((err) => {
        if (isNotFoundError(err)) setNotFound(true)
        else setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [eventId, attempt])

  function retry() {
    setError('')
    setLoading(true)
    setAttempt((n) => n + 1)
  }

  const isUpcoming = event !== null && event.event_date >= todayString()

  return (
    <section className="mx-auto max-w-4xl">
      <BackLink to="/events" label="Back to events" />

      {loading && <LoadingState label="Loading event..." />}

      {notFound && (
        <div className="py-10 text-center">
          <h1 className="text-2xl font-bold text-ink">Event not found</h1>
          <p className="mt-2 text-muted">This event does not exist or has been removed.</p>
          <ButtonLink to="/events" className="mt-6">
            See all events
          </ButtonLink>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={retry} className="mt-4" />}

      {event && (
        <Card className="mt-2">
          <Badge tone={isUpcoming ? 'success' : 'neutral'}>{isUpcoming ? 'Upcoming' : 'Past event'}</Badge>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink md:text-3xl">{event.title}</h1>
          <dl className="mt-5 grid gap-4 rounded-lg bg-page p-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Date</dt>
              <dd className="font-medium text-ink">{formatEventDate(event.event_date)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Location</dt>
              <dd className="font-medium break-words text-ink">{event.location}</dd>
            </div>
          </dl>
          {/* whitespace-pre-line keeps the line breaks the admin typed */}
          <p className="mt-6 leading-relaxed whitespace-pre-line text-ink">{event.description}</p>
        </Card>
      )}

      {/* Only requested for team members and admins, so public visitors send no finance request at all */}
      {event && profile && hasRole(profile.role, TEAM_ROLES) && <EventFinanceSection eventId={event.id} role={profile.role} />}

      {/* Albums are loaded separately, once we know the event exists */}
      {event && <EventAlbums eventId={event.id} />}
    </section>
  )
}

export default EventDetailsPage
