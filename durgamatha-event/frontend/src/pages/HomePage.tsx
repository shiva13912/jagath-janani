import { useCallback } from 'react'
import { Link } from 'react-router'
import AlbumCard from '../components/AlbumCard'
import EventCard, { EventCardSkeleton } from '../components/EventCard'
import { ButtonLink } from '../components/ui/Button'
import { cardClass } from '../components/ui/Card'
import { SectionTitle } from '../components/ui/PageHeader'
import { siteInfo } from '../config/siteInfo'
import { useApiData } from '../hooks/useApiData'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { getAlbums } from '../services/albumService'
import { getEvents } from '../services/eventService'
import { getGalleryMedia } from '../services/mediaService'
import { todayString } from '../utils/date'
import { thumbnailUrl } from '../utils/mediaFiles'

// Public home page. Every event, album and photo shown here comes from the database;
// a section with nothing to show is simply left out (no made-up content).
function HomePage() {
  usePageTitle('Home')
  const { isAuthenticated } = useAuth()

  const events = useApiData(getEvents)
  const albums = useApiData(useCallback(() => getAlbums(), []))
  const photos = useApiData(useCallback(() => getGalleryMedia({ page: 1, type: 'image', eventId: '', albumId: '', limit: 8 }), []))

  // The API lists upcoming events first (soonest first); keep the next three
  const upcoming = (events.data ?? []).filter((event) => event.event_date >= todayString()).slice(0, 3)
  const recentAlbums = (albums.data ?? []).slice(0, 3) // newest first
  const highlights = photos.data?.media ?? []

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="rounded-2xl border border-orange-100 bg-primary-soft px-6 py-12 text-center sm:px-10 sm:py-16">
        <p className="text-sm font-semibold tracking-wide text-secondary uppercase">{siteInfo.tagline}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">{siteInfo.name}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">{siteInfo.intro}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink to="/events">View Events</ButtonLink>
          <ButtonLink to="/gallery" variant="secondary">
            Open Gallery
          </ButtonLink>
        </div>
      </section>

      {/* Upcoming events */}
      <section aria-labelledby="home-events">
        <SectionHeader id="home-events" title="Upcoming events" link={{ to: '/events', label: 'All events' }} />
        {events.loading && <EventCardSkeleton />}
        {events.data && upcoming.length === 0 && (
          <p className="text-muted">
            No upcoming events right now.{' '}
            <Link to="/events" className="font-medium text-primary underline-offset-2 hover:underline">
              See past events
            </Link>
          </p>
        )}
        {upcoming.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Recent albums (hidden when there are none) */}
      {recentAlbums.length > 0 && (
        <section aria-labelledby="home-albums">
          <SectionHeader id="home-albums" title="Recent albums" link={{ to: '/gallery?tab=albums', label: 'All albums' }} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} eventTitle={album.event?.title} />
            ))}
          </div>
        </section>
      )}

      {/* Gallery highlights: the 8 newest photos, as small Cloudinary thumbnails */}
      {highlights.length > 0 && (
        <section aria-labelledby="home-gallery">
          <SectionHeader id="home-gallery" title="Gallery highlights" link={{ to: '/gallery', label: 'Open gallery' }} />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {highlights.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.album ? `/albums/${item.album.id}` : '/gallery'}
                  className="block overflow-hidden rounded-xl bg-gray-100"
                  aria-label={`Photo from ${item.album?.name ?? 'the gallery'}`}
                >
                  <img src={thumbnailUrl(item)} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover transition hover:scale-105" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* About the organisation, from config/siteInfo.ts */}
      <section aria-labelledby="home-about" className={`${cardClass} p-6 sm:p-8`}>
        <SectionTitle id="home-about">About us</SectionTitle>
        <div className="mt-3 max-w-3xl space-y-3 text-muted">
          {siteInfo.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link to="/about" className="mt-4 inline-flex min-h-10 items-center font-semibold text-primary hover:underline">
          Read more about us
        </Link>
      </section>

      {/* Call to action */}
      <section className="rounded-2xl bg-secondary px-6 py-10 text-center text-white sm:px-10">
        <h2 className="text-2xl font-bold">Relive every celebration</h2>
        <p className="mx-auto mt-2 max-w-xl text-rose-100">
          Browse photos and videos from our events{isAuthenticated ? '.' : ', or create a free account to stay connected.'}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink to="/gallery" variant="secondary">
            Browse the gallery
          </ButtonLink>
          {!isAuthenticated && (
            <ButtonLink to="/register" className="bg-white/10 ring-1 ring-white/60 hover:bg-white/20">
              Create an account
            </ButtonLink>
          )}
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ id, title, link }: { id: string; title: string; link: { to: string; label: string } }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <SectionTitle id={id}>{title}</SectionTitle>
      <Link to={link.to} className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">
        {link.label} →
      </Link>
    </div>
  )
}

export default HomePage
