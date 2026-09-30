import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { isValidEmail } from '../utils/validation'

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in? No need to see the login form.
  if (isAuthenticated && !submitting) {
    return <Navigate to="/profile" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')

    // Check the inputs before calling Supabase
    if (!isValidEmail(email)) return setError('Please enter a valid email address.')
    if (!password) return setError('Please enter your password.')

    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-orange-600 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-orange-600 hover:underline">
          Register
        </Link>
      </p>
    </section>
  )
}

export default LoginPage
