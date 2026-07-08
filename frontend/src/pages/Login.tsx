import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

interface LoginErrors {
  email?: string
  password?: string
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validate = (): LoginErrors => {
    const nextErrors: LoginErrors = {}

    if (!email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!password) {
      nextErrors.password = 'Password is required.'
    }

    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      // Phase 1 is frontend-only: no real authentication happens here.
      setIsSubmitted(true)
    }
  }

  return (
    <section className="auth-section section">
      <div className="container auth-container">
        <div className="auth-card card">
          <div className="auth-header">
            <h1>Log in to LostLens</h1>
            <p>Welcome back. Enter your details to continue.</p>
          </div>

          {isSubmitted && (
            <div className="auth-success" role="status">
              You&apos;re logged in! (This is a frontend demo — no account was
              actually accessed.)
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="form-error" id="login-email-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="form-error" id="login-password-error">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="auth-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
              <a href="#forgot-password" className="auth-link-muted">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Login
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
