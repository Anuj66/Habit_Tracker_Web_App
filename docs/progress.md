# Progress Report

## Completed Tasks (Timestamped)
- 2026-02-15 09:00:00 - Created project directory structure and initialized Git repository.
- 2026-02-15 09:10:00 - Created docs folder and drafted initial implementation plan.
- 2026-02-15 09:30:00 - Initialized Node/Express backend in `server` workspace and installed dependencies.
- 2026-02-15 09:45:00 - Created SQLite database schema and tables (habits, tracking, suggestions).
- 2026-02-15 10:00:00 - Implemented REST API endpoints for habits, tracking, and suggestions.
- 2026-02-15 10:20:00 - Initialized React/Vite frontend in `client` workspace and installed dependencies.
- 2026-02-15 10:40:00 - Implemented core UI components (Layout, Habit List, Progress View, Suggestions).
- 2026-02-15 11:00:00 - Integrated Recharts for progress graph visualization.
- 2026-02-15 11:15:00 - Wired frontend to backend API and verified end-to-end flows locally.
- 2026-02-15 11:45:00 - Added basic styling and layout for responsive habit tracking experience.
- 2026-02-15 12:15:00 - Configured monorepo-style npm workspaces for `server` and `client`.
- 2026-02-15 12:45:00 - Added ESLint and Prettier configuration for both frontend and backend.
- 2026-02-15 13:30:00 - Created GitHub Actions CI workflow for lint, test, and build across Node 14.x/16.x/18.x.
- 2026-02-15 14:00:00 - Added Dependabot configuration for automated dependency update PRs.
- 2026-02-15 14:30:00 - Configured semantic-release and changelog generation.
- 2026-02-15 15:00:00 - Added environment-variable-based API base URL to the React client (`VITE_API_URL`).
- 2026-02-15 15:30:00 - Updated Express server to support configurable `PORT` and serve built client assets.
- 2026-02-15 16:00:00 - Created multi-stage Dockerfile for dev (client/server) and production builds.
- 2026-02-15 16:15:00 - Added `.dockerignore` to optimize Docker build context size.
- 2026-02-15 16:30:00 - Created `docker-compose.yml` for local development (server + client services).

## In-Progress Work
- Analyze GitHub repository open pull requests to identify causes of high PR count.
- Refine CI/CD pipeline behavior based on findings from open PR analysis.
- Iterate on Docker configuration based on real-world deployment feedback (resource usage, scaling).

## Upcoming Milestones
- Close or merge stale dependency update PRs after resolving breaking changes and CI failures.
- Enable stricter branch protection rules tied to required status checks from CI.
- Add additional automated tests for critical flows (habit CRUD, tracking, suggestions).
- Extend containerization to support production-ready deployment environments (reverse proxy, TLS).

## How to Run (Local, Without Docker)
1. **Backend**:
   ```bash
   cd server
   npm install
   node index.js
   ```
   The server runs on `http://localhost:5000`.

2. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The client runs on `http://localhost:5173` (or similar).

## How to Run (With Docker - Local Development)
1. Build and start the stack:
   ```bash
   cd Habit_Tracker_Web_App
   docker compose up --build
   ```
   - Server is available at `http://localhost:5000`.
   - Client (Vite dev server) is available at `http://localhost:5173`.

2. Stop the stack:
   ```bash
   docker compose down
   ```

## Production Build and Deployment (Docker)
1. Build the optimized production image (server + built client):
   ```bash
   cd Habit_Tracker_Web_App
   docker build -t habit-tracker-app --target production .
   ```

2. Run the container:
   ```bash
   docker run -p 5000:5000 --name habit-tracker-app habit-tracker-app
   ```

3. Access the app:
   - Application UI: `http://localhost:5000`
   - API base path: `http://localhost:5000/api`

## Testing Procedures
- Local development:
  - Run `npm run lint` and `npm run test` from the project root to validate both workspaces.
  - Use `docker compose up` and manually verify key flows:
    - Creating, updating, and deleting habits.
    - Marking habits as completed for a given day.
    - Viewing progress graphs and suggestions.

- Production image:
  - Build the `production` target image.
  - Run the container and verify that:
    - The UI loads correctly from `http://localhost:5000`.
    - All `/api/...` endpoints respond as expected.
    - Habit data persists inside the container across requests.

## Future Scope / Enhancements
- Cloud Database (PostgreSQL/MongoDB) for multi-device access.
- Notifications/Reminders.
- Gamification (streaks, badges, achievements).
- Additional analytics and reporting dashboards.
- More granular habit configuration (per-day schedules, priorities).

## Authentication Implementation Status

- 2026-02-21 10:45:00 - Added `users`, `auth_identities`, `email_verification_tokens`, and `password_reset_tokens` tables to the SQLite schema.
- 2026-02-21 10:50:00 - Implemented backend authentication router with:
  - Traditional email/password registration and login (bcrypt password hashing, account lockout on repeated failures, JWT-based session cookie).
  - Email verification workflow using time-limited verification tokens.
  - Password reset workflow using time-limited reset tokens.
  - Google OAuth 2.0 integration (authorization code flow, profile retrieval, user provisioning/linking).
  - GitHub OAuth 2.0 integration (`user:email` scope, profile and email retrieval, user provisioning/linking).
  - Unified user identity model via `users` and `auth_identities` tables.
- 2026-02-21 11:05:00 - Added CSRF protection (cookie-based tokens with `x-csrf-token` header) and rate limiting for all `/api/auth` endpoints.
- 2026-02-21 11:15:00 - Implemented frontend authentication flows in React:
  - Responsive login page with email/password, Google, and GitHub sign-in options.
  - Registration page with password confirmation and feedback messaging.
  - Email verification handling page that consumes `token` query parameter.
  - Password reset request and confirm pages using reset tokens.
  - Auth-aware layout that shows the current user email and supports sign out.
- 2026-02-21 11:30:00 - Added automated tests for core authentication flows (registration, email verification, login, CSRF enforcement) using Jest and Supertest on the backend.

## Authentication Setup Instructions

### 1. Environment Variables

Configure the following environment variables for the server (for example in a `.env` file loaded by your process manager or shell):

- `JWT_SECRET` – strong random secret for signing JWT access tokens.
- `JWT_EXPIRES_IN` – optional; JWT lifetime (for example `1h`).
- `CLIENT_ORIGIN` – frontend origin for redirects and CORS (default: `http://localhost:5173`).

Google OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default: `http://localhost:5000/api/auth/google/callback`)

GitHub OAuth:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REDIRECT_URI` (default: `http://localhost:5000/api/auth/github/callback`)

### 2. Google OAuth Configuration

1. Go to the Google Cloud Console and create an OAuth 2.0 Client ID (Web application).
2. Configure authorized redirect URI:
   - `http://localhost:5000/api/auth/google/callback` (for local development).
3. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Ensure the consent screen is configured with your application name and scopes `openid`, `email`, and `profile`.

### 3. GitHub OAuth Configuration

1. Create a new OAuth App in GitHub settings.
2. Set the authorization callback URL:
   - `http://localhost:5000/api/auth/github/callback` (for local development).
3. Request scope `user:email` to read primary and verified email addresses.
4. Copy the client ID and secret into `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

### 4. Traditional Authentication Usage

1. Registration:
   - Users register with email, optional name, and password via the `/register` page.
   - Passwords are hashed with bcrypt before storing in the `users` table.
2. Email verification:
   - After registration, an email verification token is generated and stored with an expiry.
   - In development, the raw token is returned in the API response for manual testing.
   - The verify email page expects a `token` query parameter (for example `/verify-email?token=...`).
3. Login:
   - Login requires a verified email and correct password.
   - Failed login attempts are tracked and accounts are locked temporarily after repeated failures.
   - A short-lived JWT is issued and stored in an HTTP-only `auth_token` cookie.
4. Password reset:
   - Users request a reset from `/reset-password` with their email.
   - A time-limited reset token is created and (in development) returned in the API response.
   - The reset confirmation page expects a `token` query parameter (for example `/reset-password/confirm?token=...`).

### 5. Frontend Authentication Flows

- Login/Registration:
  - New pages under `/login` and `/register` provide email/password flows and OAuth entry points.
  - The React app includes an `AuthProvider` and `RequireAuth` wrapper to protect habit routes.
- OAuth:
  - Google and GitHub buttons redirect to backend OAuth endpoints:
    - `http://localhost:5000/api/auth/google`
    - `http://localhost:5000/api/auth/github`
  - On success, users are redirected back to `CLIENT_ORIGIN` with an authenticated session cookie.
- Session and CSRF:
  - The Axios client is configured with `withCredentials: true` and calls `/api/auth/csrf` to obtain CSRF tokens for form submissions.
  - All sensitive auth mutations include the `x-csrf-token` header.
