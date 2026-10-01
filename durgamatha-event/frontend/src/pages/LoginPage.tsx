import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { InputField, PasswordField } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { isValidEmail } from '../utils/validation'

type LoginField = 'email' | 'password'

function LoginPage() {
  usePageTitle('Login')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [badField, setBadField] = useState<LoginField | null>(null) // highlighted field
  const [submitting, setSubmitting] = useState(false)

  // Already logged in? No need to see the login form.
  if (isAuthenticated && !submitting) {
    return <Navigate to="/profile" replace />
  }

  // Shows the message and puts the cursor in the field that needs fixing
  function fail(field: LoginField, message: string) {
    setError(message)
    setBadField(field)
    document.getElementById(field)?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')
    setBadField(null)

    // Check the inputs before calling Supabase
    if (!isValidEmail(email)) return fail('email', 'Please enter a valid email address.')
    if (!password) return fail('password', 'Please enter your password.')

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
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-ink">Login</h1>
      <p className="mt-1 text-muted">Welcome back. Log in to your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <InputField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={badField === 'email'}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          invalid={badField === 'password'}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <Alert tone="error">{error}</Alert>}

        <Button type="submit" fullWidth loading={submitting} loadingText="Logging in...">
          Login
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-primary underline-offset-2 hover:underline">
          Register
        </Link>
      </p>
    </Card>
  )
}

export default LoginPage
