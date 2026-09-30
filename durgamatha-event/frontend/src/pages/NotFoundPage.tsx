import { Link } from 'react-router'

function NotFoundPage() {
  return (
    <section className="py-12 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-orange-600 hover:underline">
        Go back home
      </Link>
    </section>
  )
}

export default NotFoundPage
