import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getHealth } from '../services/healthService'

type ApiStatus = 'checking' | 'online' | 'offline'

function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  // Runs once when the page opens: checks that the frontend can reach the backend
  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <section className="py-12 text-center">
      <h1 className="text-3xl font-bold md:text-5xl">Welcome to Durgamatha Events</h1>
      <p className="mx-auto mt-4 max-w-2xl text-gray-600">
        Find and follow the events of Durgamatha in one place.
      </p>
      <Link
        to="/events"
        className="mt-8 inline-block rounded bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700"
      >
        View Events
      </Link>

      {/* Temporary developer check for Phase 1 */}
      <p className="mt-8 text-sm text-gray-500">
        API status:{' '}
        {apiStatus === 'checking' && <span>checking...</span>}
        {apiStatus === 'online' && <span className="font-semibold text-green-600">online</span>}
        {apiStatus === 'offline' && <span className="font-semibold text-red-600">offline</span>}
      </p>
    </section>
  )
}

export default HomePage
