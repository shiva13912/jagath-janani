import { Link } from 'react-router'
import type { Event } from '../types/event'
import { formatEventDate, todayString } from '../utils/date'
import { ButtonLink } from './ui/Button'
import Badge from './ui/Badge'
import { cardClass } from './ui/Card'

// Shortens long descriptions for the cards (the details page shows the full text)
function shorten(text: string, maxLength = 140): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text
}

// One event card, used on the Events page and the home page
function EventCard({ event }: { event: Event }) {
  const [year, month, day] = event.event_date.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const upcoming = event.event_date >= todayString()

  return (
    <article className={`${cardClass} flex flex-col p-5`}>
      <div className="flex items-start gap-4">
        {/* A calendar-style date block; the full date is also written out for screen readers */}
        <div aria-hidden="true" className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-primary-soft py-1.5 text-primary-hover">
          <span className="text-xs font-semibold uppercase">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
          <span className="text-2xl leading-none font-bold">{day}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold text-ink">
            <Link to={`/events/${event.id}`} className="hover:text-primary">
              {event.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted">
            {formatEventDate(event.event_date)} · {event.location}
          </p>
          <div className="mt-2">
            <Badge tone={upcoming ? 'primary' : 'neutral'}>{upcoming ? 'Upcoming' : 'Past event'}</Badge>
          </div>
        </div>
      </div>
      <p className="mt-4 flex-1 text-muted">{shorten(event.description)}</p>
      <ButtonLink to={`/events/${event.id}`} variant="secondary" size="sm" className="mt-4 self-start" aria-label={`View Event: ${event.title}`}>
        View Event
      </ButtonLink>
    </article>
  )
}

// Grey placeholder cards while events load
export function EventCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status">
      <span className="sr-only">Loading events...</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={`${cardClass} h-56 animate-pulse p-5`}>
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-3 rounded bg-gray-200" />
              <div className="h-3 w-5/6 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EventCard
