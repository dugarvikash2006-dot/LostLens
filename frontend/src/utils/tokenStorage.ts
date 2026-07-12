// Centralized access to the persisted auth token — nothing else in the
// app should touch localStorage directly for this.
//
// NOTE on architecture: this stores the JWT in localStorage, which is
// readable by any JavaScript running on the page (i.e. vulnerable to XSS).
// That's an accepted trade-off for the current phase. A future production
// hardening phase may move authentication to secure, httpOnly cookies
// instead, which would remove the need for this file entirely.
const AUTH_TOKEN_KEY = 'lostlens_auth_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    // Some environments (e.g. private browsing with storage disabled)
    // throw on access — treat that the same as "no token stored".
    return null
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // If persistence isn't available, the user still stays logged in for
    // the current session via in-memory React state.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // no-op
  }
}
