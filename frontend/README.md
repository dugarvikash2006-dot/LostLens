# LostLens Frontend

React + TypeScript + Vite frontend for LostLens, an intelligent lost-and-found
platform. This covers Phase 1 (UI) through Phase 3B (Found Item Reporting).

## Tech Stack

- React 19, TypeScript, Vite
- React Router
- Plain CSS (design tokens in `src/index.css`)
- Native `fetch` for API calls (no Axios, no state-management library —
  authentication state is a single React Context)

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Environment Variables

See `.env.example`:

- `VITE_API_URL` — base URL of the LostLens backend API. Defaults to
  `http://localhost:5001` if unset, since that's where the backend runs in
  local development (see `backend/README.md`).

The backend must be running (with a real database migrated/seeded, and
`CORS_ORIGIN=http://localhost:5173` in its own `.env`) for signup, login,
and `/me` to work. Everything else in the app (Home, static pages) works
without it.

## Scripts

```bash
npm run dev       # start the dev server
npm run build      # typecheck + production build
npm run lint       # ESLint
npm run preview    # preview the production build locally
```

## Authentication (Phase 2D)

The Login and Signup pages are wired to the real backend:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

**Architecture:**

- `src/api/client.ts` — a single `apiRequest()` wrapper around `fetch`.
  Adds `Content-Type: application/json`, attaches
  `Authorization: Bearer <token>` when a token is passed, and throws either
  an `ApiError` (a real HTTP error response from the backend, with the
  backend's own safe message) or a `NetworkError` (fetch itself failed —
  offline, backend not running, CORS rejection, etc.). Components render
  `error.message` as plain text; it is never treated as HTML.
- `src/api/auth.api.ts` — typed `signupRequest`/`loginRequest`/`meRequest`
  functions built on top of the client.
- `src/context/auth-context.ts` + `src/context/AuthContext.tsx` +
  `src/context/useAuth.ts` — the `AuthProvider` component and `useAuth()`
  hook (split into separate files so Vite's fast refresh can still treat
  each file as either "only a component" or "only a hook/value", which it
  requires for hot-reloading to work correctly).
- `src/utils/tokenStorage.ts` — the *only* place that touches
  `localStorage` for auth. The token is stored under the key
  `lostlens_auth_token`.
- `src/components/ProtectedRoute.tsx` — reusable wrapper for routes that
  should require login. **Not applied to any route yet** — there's
  nothing to protect until a later phase adds one (e.g. a dashboard).

### Token storage note

The JWT is currently stored in `localStorage`. This is simple and works
for this phase, but it means any script running on the page (e.g. via an
XSS vulnerability) could read the token. A future production-hardening
phase may move authentication to secure, `httpOnly` cookies instead, which
would remove `tokenStorage.ts` entirely in favor of the browser handling
the cookie automatically. That change is out of scope here and was not
made to the backend.

### Session restoration

On app load, if a token is stored, the app calls `GET /api/auth/me` to ask
the backend who it belongs to — the token's contents are never trusted
directly as proof of identity. While this check is in flight, the app
shows a minimal loading state instead of the full page, so the Navbar
never flashes a "logged out" state right before flipping to "logged in".

- If `/me` succeeds → the user is restored.
- If `/me` returns 401 (invalid/expired token, or the user no longer
  exists) → the stored token is cleared and the user is treated as logged
  out.
- If `/me` fails for any other reason (network error, backend down,
  temporary 5xx) → the stored token is **left alone** and the user is
  simply treated as logged out for this session. A brief backend hiccup
  shouldn't silently log someone out for good.

### Logout

Clears the stored token, clears the in-memory user, and returns to `/`.

### Google Sign-In

Not implemented in this phase (planned for Phase 2E). The current
Login/Signup UI doesn't include a Google button, so there was nothing to
disable or preserve here.

## Lost Item Reporting (Phase 3A)

Three protected pages, backed by `src/api/item.api.ts`:

- `/create-lost` (`CreateLostReport.tsx`) — form for Title, Description,
  Category (select), Location, Date Lost. Calls
  `POST /api/items/lost`; on success navigates to `/my-reports`.
- `/my-reports` (`MyLostReports.tsx`) — calls `GET /api/items/mine` on
  mount, shows a card per report (Title, Category, Location, Date Lost,
  Reported On, Status), newest first. Each card links to `/items/:id`.
- `/items/:id` (`ItemDetails.tsx`) — calls `GET /api/items/:id` for the
  full report. If the report belongs to someone else, the backend returns
  403 and the page shows that message rather than the report.

All routes are wrapped in `ProtectedRoute` — visiting them while logged
out redirects to `/login`. The Navbar shows "Create Lost Report" and
"My Lost Reports" links only when authenticated, next to the existing
Home/Browse Items/How It Works links.

Types for all of this live in `src/types/item.ts` (`ItemReport`,
`CreateLostReportRequest`, `MyReportsResponse`, etc.), matched exactly to
the real backend response shapes — no reshaping happens between what the
backend returns and what these pages render.

The category list
(`ELECTRONICS`/`ACCESSORIES`/`BAGS`/`DOCUMENTS`/`KEYS`/`CLOTHING`/`BOOKS`/`OTHER`)
is fixed to match the backend's enum.

## Found Item Reporting (Phase 3B)

Mirrors Lost Item Reporting, reusing shared components rather than
duplicating whole pages:

- `/create-found` (`CreateFoundReport.tsx`) — same fields as the lost
  form, labeled "Date Found". Calls `POST /api/items/found`; on success
  navigates to `/my-found`.
- `/my-found` (`MyFoundReports.tsx`) — calls `GET /api/items/found/mine`,
  same card layout as My Lost Reports. Each card links to `/found/:id`.
- `/found/:id` (`FoundReportDetails.tsx`) — calls
  `GET /api/items/found/:id`. Same 403/404 handling as the lost details
  page.

The Navbar additionally shows "Create Found Report" and
"My Found Reports" when authenticated, alongside the lost-report links.

### What got shared (refactor from Phase 3A)

Phase 3A's create/list/detail pages for LOST were fully self-contained,
which would have meant near-duplicate code for FOUND. Instead:

- **`src/components/ReportForm.tsx`** — the actual Title/Description/
  Category/Location/Date form, field state, validation, loading state,
  and error display. `CreateLostReport.tsx` and `CreateFoundReport.tsx`
  are now just a few lines each: they pass in labels and an `onSubmit`
  that calls the right API function and navigates to the right place.
- **`src/components/ReportCard.tsx`** — the summary card used in both
  "My Reports" grids (`dateLabel` prop controls whether it reads
  "Lost ..." or "Found ...").
- **`src/components/ReportDetails.tsx`** — the full-detail layout used by
  both detail pages (`dateLabel`/`backTo`/`backLabel` props vary the
  wording and back-link).
- **`src/utils/formatDate.ts`** — the shared date-formatting helper both
  of the above use.
- **Backend-facing types** in `src/types/item.ts` — `ItemReport` already
  covered both report types from Phase 3A; this phase added
  `CreateFoundReportRequest`/`Response` as thin siblings of the LOST
  versions rather than duplicating the whole `ItemReport` shape.

`CreateLostReport.tsx`, `MyLostReports.tsx`, and `ItemDetails.tsx` still
exist as their own files with unchanged URLs and behavior — only their
internal implementation now delegates to the shared components above.

## Manual Testing Sequence

With the backend running on `http://localhost:5001` (migrated + reachable)
and this app running on `http://localhost:5173`:

1. Go to `/signup`, create an account with a new email → should redirect
   to `/` and the Navbar should show "Hi, `<first name>`" and a Logout
   button.
2. Refresh the page → still logged in (verifies `/api/auth/me` restoration).
3. Click Logout → Navbar returns to Login/Sign Up; refresh → still logged
   out.
4. Go to `/login` with the same account → should log in and redirect to
   `/`.
5. Try `/signup` again with the same email → should show
   "An account with this email already exists." inline, not a crash.
6. Try `/login` with a wrong password, then with an email that doesn't
   exist → both should show the same generic
   "Invalid email or password." message.
7. Stop the backend and try logging in → should show a network-error
   message (not a blank page or `[object Object]`).
8. While logged out, visit `/create-lost`, `/my-reports`, `/create-found`,
   or `/my-found` directly → all redirect to `/login`.
9. Log in, go to "Create Lost Report", submit a valid report → redirected
   to `/my-reports` and the new report appears at the top.
10. Go to "Create Found Report", submit a valid report → redirected to
    `/my-found` and the new report appears at the top.
11. Submit either form with empty fields → inline validation errors, no
    request sent.
12. On "My Lost Reports", click a report card → `/items/:id` shows the
    full details. Same for "My Found Reports" → `/found/:id`.
13. Log in as a *different* user and manually visit another user's
    `/items/:id` or `/found/:id` URL → shows a "you do not have
    permission" message instead of the report.
14. Refresh `/my-reports` and `/my-found` → both reload from the backend
    (not stale local state).

## Regression Notes

Existing pages, routes, and visual design from Phase 1 are unchanged:
Home, 404, and the overall look of Login/Signup. Phase 3A's lost-report
pages keep the same URLs and behavior after the shared-component
refactor. `npm run build` and `npm run lint` both pass.


