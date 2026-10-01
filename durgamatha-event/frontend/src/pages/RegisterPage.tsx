import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { InputField, PasswordField } from '../components/ui/Field'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation'

type RegisterField = 'fullName' | 'email' | 'password' | 'confirmPassword'

function RegisterPage() {
  usePageTitle('Register')
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [badField, setBadField] = useState<RegisterField | null>(null)
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated && !submitting) {
    return <Navigate to="/profile" replace />
  }

  // Returns the first problem (which field and why), or null if everything is fine
  function validate(): { field: RegisterField; message: string } | null {
    if (!fullName.trim()) return { field: 'fullName', message: 'Please enter your full name.' }
    if (!isValidEmail(email)) return { field: 'email', message: 'Please enter a valid email address.' }
    if (password.length < MIN_PASSWORD_LENGTH) return { field: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    if (password !== confirmPassword) return { field: 'confirmPassword', message: 'Passwords do not match.' }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBadField(null)
    setSuccess('')

    const problem = validate()
    if (problem) {
      setError(problem.message)
      setBadField(problem.field)
      document.getElementById(problem.field)?.focus() // the cursor goes to the field to fix
      return
    }

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
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-ink">Create an account</h1>
      <p className="mt-1 text-muted">Register to follow Durgamatha events.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <InputField
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          invalid={badField === 'fullName'}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={password}
          invalid={badField === 'password'}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          invalid={badField === 'confirmPassword'}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <Button type="submit" fullWidth loading={submitting} loadingText="Creating account...">
          Register
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary underline-offset-2 hover:underline">
          Login
        </Link>
      </p>
    </Card>
  )
}

export default RegisterPage
