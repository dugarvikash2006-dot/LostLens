import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { ApiError } from '../api/client'
import './Auth.css'

interface SignupErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const MIN_PASSWORD_LENGTH = 8

function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignupErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Basic, non-duplicative frontend checks — the backend remains the
  // source of truth for the real password policy and email uniqueness.
  const validate = (): SignupErrors => {
    const nextErrors: SignupErrors = {}

    if (!fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    setFormError(null)
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await signup({ fullName: fullName.trim(), email, password })
      // Auth state updates immediately via context.
      navigate('/dashboard')
    } catch (error) {
      if (error instanceof ApiError) {
        // Covers duplicate email (409) and backend validation errors
        // (400) alike — the backend's message is safe to show directly.
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-section section">
      <div className="container auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1>Create your account</h1>
            <p>Join LostLens to report and track lost or found items.</p>
          </div>

          {formError && (
            <div className="auth-error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
                placeholder="Jane Doe"
                autoComplete="name"
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="form-error" id="signup-name-error">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="form-error" id="signup-email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="form-error" id="signup-password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? 'signup-confirm-password-error' : undefined
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="form-error" id="signup-confirm-password-error">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Signup
