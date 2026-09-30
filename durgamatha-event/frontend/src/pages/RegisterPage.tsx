import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import FormField from '../components/FormField'
import { useAuth } from '../hooks/useAuth'
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation'

function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated && !submitting) {
    return <Navigate to="/profile" replace />
  }

  // Returns an error message, or '' if everything is fine
  function validate(): string {
    if (!fullName.trim()) return 'Please enter your full name.'
    if (!isValidEmail(email)) return 'Please enter a valid email address.'
    if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    if (password !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) return setError(validationError)

    setSubmitting(true)
    try {
      // Note: no role is sent. Every new account gets PUBLIC from the database.
      const loggedIn = await register({ fullName: fullName.trim(), email: email.trim(), password })
      if (loggedIn) {
        navigate('/profile', { replace: true })
      } else {
        // Happens when "Confirm email" is turned on in Supabase
        setSuccess('Account created! Please check your email to confirm your account, then log in.')
        setSubmitting(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">Create an account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <FormField
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-orange-600 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-orange-600 hover:underline">
          Login
        </Link>
      </p>
    </section>
  )
}

export default RegisterPage
