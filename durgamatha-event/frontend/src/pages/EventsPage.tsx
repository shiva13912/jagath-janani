import EventCard, { EventCardSkeleton } from '../components/EventCard'
import PageHeader from '../components/ui/PageHeader'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { usePageTitle } from '../hooks/usePageTitle'
import { getEvents } from '../services/eventService'

// Public page: anyone can see the list of events (upcoming first, then past ones)
function EventsPage() {
  usePageTitle('Events')
  const { data: events, error, loading, reload } = useApiData(getEvents)

  return (
    <section>
      <PageHeader title="Events" subtitle="Upcoming celebrations first, then past events." />

      {loading && <EventCardSkeleton count={6} />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {events?.length === 0 && <EmptyState message="No events yet. Please check back soon." />}

      {/* 1 column on phones, 2 on tablets, 3 on large screens */}
      {events && events.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}

export default EventsPage
