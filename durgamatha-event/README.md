# Durgamatha Event Management Website

A web application for managing and sharing the events of Durgamatha. Visitors will be able to browse events and view event photos and videos, and organizers will be able to manage them.

The project is being built in phases. Phase 1 (project foundation), Phase 2 (authentication and roles) and Phase 3 (event management) are done.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, Supabase JS client |
| Backend | Node.js, Express.js, TypeScript (REST API), Supabase JS client |
| Database & Auth | Supabase PostgreSQL, Supabase Auth (email + password) |
| Media | Cloudinary *(planned)* |
| Deployment | Vercel (frontend), Render (backend), GitHub (source code) *(planned)* |

## Project structure

```
durgamatha-event/
├── frontend/                 React app (runs on http://localhost:5173)
│   ├── public/               Static files (favicon)
│   ├── src/
│   │   ├── components/       Reusable UI pieces (Navbar, FormField, ProtectedRoute, EventForm)
│   │   ├── config/           Supabase client (public key only)
│   │   ├── context/          AuthContext + AuthProvider (logged-in user state)
│   │   ├── pages/            One file per page (Home, Events, Event details, Login, Register, Profile, Admin, admin event pages, ...)
│   │   ├── layouts/          Shared page layout (navbar + footer)
│   │   ├── routes/           All URL routes in one place
│   │   ├── services/         API calls (Axios instance, auth, event and health services)
│   │   ├── hooks/            Custom React hooks (useAuth)
│   │   ├── types/            TypeScript types
│   │   ├── utils/            Helpers (form validation, role lists, dates, API error messages)
│   │   ├── assets/           Images and other assets (empty for now)
│   │   ├── App.tsx
│   │   └── main.tsx          Entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  Express API (runs on http://localhost:5000)
│   ├── src/
│   │   ├── config/           Environment variables + Supabase admin client
│   │   ├── controllers/      Request handlers
│   │   ├── middleware/       requireAuth, requireRole, not-found and error handling
│   │   ├── routes/           API routes (all under /api)
│   │   ├── services/         Database access (profiles, events)
│   │   ├── types/            TypeScript types (roles, req.user, events)
│   │   ├── utils/            Helpers (event validation)
│   │   ├── app.ts            Creates and configures the Express app
│   │   └── server.ts         Starts the server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── schema.sql            Database schema: roles, profiles, events, security rules, triggers
│
├── .gitignore
├── README.md
└── package.json              Shortcut scripts for both apps
```

## Supabase setup

Do this once, before running the app.

1. **Create a project** at https://supabase.com/dashboard (**New project**). Save the database password somewhere safe; the app does not use it.
2. **Email login:** in **Authentication → Sign In / Providers → Email**, keep Email enabled. Other providers stay off.
3. **Confirm email:** turn **"Confirm email" off** during development, so new accounts can log in right away (Supabase's built-in email sender is heavily limited). Turn it back on with a real email provider before deploying.
4. **Site URL:** in **Authentication → URL Configuration**, set it to `http://localhost:5173`.
5. **Database:** open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates:
   - the `user_role` enum (`ADMIN`, `TEAM_MEMBER`, `PUBLIC`)
   - the `profiles` table (`id`, `full_name`, `email`, `role`, `avatar_url`, `created_at`, `updated_at`)
   - Row Level Security: users can only **read** their own profile and cannot insert, update or delete profiles
   - a trigger that creates a `PUBLIC` profile for every new sign-up
   - the `events` table (Phase 3), with Row Level Security turned on

   If you already ran the Phase 2 part earlier, run only the **Phase 3** section at the bottom of the file.
6. **Keys:** in **Project Settings → API Keys** you'll find a *publishable* key (`sb_publishable_...`) and a *secret* key (`sb_secret_...`), or, on older projects, the legacy *anon* and *service_role* keys. The **Project URL** is under **Project Settings → Data API** (or the **Connect** button). Put them in the `.env` files as described below.

## Local development

### Requirements

- Node.js 20.19+ or 22.12+ (required by Vite; developed with Node.js 22)
- npm
- A Supabase project (see above)

### 1. Install dependencies

From the `durgamatha-event` folder:

```bash
npm run install:all
```

This runs `npm install` in both `frontend/` and `backend/`.

### 2. Create the environment files

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Then fill in your Supabase values (see [Environment variables](#environment-variables)). The backend will not start without them.

### 3. Run the backend

```bash
cd backend
npm run dev
```

The API starts on http://localhost:5000. Check it at http://localhost:5000/api/health, which should return:

```json
{ "success": true, "message": "Durgamatha API is running" }
```

### 4. Run the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173. The Home page shows **API status: online** when the backend is running.

You can also start either app from the `durgamatha-event` folder with `npm run dev:backend` or `npm run dev:frontend`.

### Other commands

| Folder | Command | What it does |
| --- | --- | --- |
| `frontend/` | `npm run build` | Type-checks and builds the app into `dist/` |
| `frontend/` | `npm run lint` | Checks the code with oxlint |
| `frontend/` | `npm run preview` | Serves the built app locally |
| `backend/` | `npm run build` | Compiles TypeScript into `dist/` |
| `backend/` | `npm start` | Runs the compiled server from `dist/` |

## Environment variables

Each app reads its settings from a `.env` file, which is never committed to Git. The `.env.example` files show which variables exist.

**Frontend** (`frontend/.env`)

| Variable | Example | Description |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000` | URL of the backend API |
| `VITE_SUPABASE_URL` | `https://abcd1234.supabase.co` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase publishable (anon) key. Safe to be public |

Only variables starting with `VITE_` are available in the frontend, and they are visible to anyone using the website. Never put secrets in the frontend `.env`.

**Backend** (`backend/.env`)

| Variable | Example | Description |
| --- | --- | --- |
| `PORT` | `5000` | Port the API server listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `FRONTEND_URL` | `http://localhost:5173` | Frontend URL allowed by CORS |
| `SUPABASE_URL` | `https://abcd1234.supabase.co` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | **Secret** key with full database access. Backend only |

> ⚠️ The service-role (secret) key bypasses all database security rules. Keep it only in `backend/.env` (or your hosting provider's settings). Never put it in frontend code, the frontend `.env`, GitHub, or a chat message.

## Roles

| Role | Can open (frontend) | Can call (backend) |
| --- | --- | --- |
| `PUBLIC` | `/profile` | `/api/auth/me`, `/api/test/protected` |
| `TEAM_MEMBER` | `/profile`, `/team` | the above + `/api/test/team` |
| `ADMIN` | `/profile`, `/team`, `/admin` | the above + `/api/test/admin` |

- Every new account starts as **`PUBLIC`**. The role is set by the database trigger; the register form cannot choose it.
- Users cannot change their own role: the `profiles` table has no update rule for users.
- **Creating the first admin:** register normally in the app, then in the Supabase dashboard open **Table Editor → profiles**, change your `role` to `ADMIN` and save. Log out and back in. Promote team members the same way. (An admin screen for this will come in a later phase.)

## Authentication flow

1. **Register** (`/register`): the frontend calls Supabase Auth `signUp` with email, password and full name. Supabase stores the password (hashed); our database trigger creates the `profiles` row with role `PUBLIC`.
2. **Login** (`/login`): the frontend calls Supabase Auth `signInWithPassword`. Supabase returns a session with an **access token** (a JWT) and saves it in the browser's localStorage, so the user stays logged in after a refresh.
3. **Profile:** `AuthProvider` listens for login/logout changes and loads the user's profile and role from `GET /api/auth/me`. Components read it with the `useAuth()` hook.
4. **Protected pages:** `ProtectedRoute` sends logged-out users to `/login` and users with the wrong role to `/unauthorized`. This is only for user experience; the backend is the real security boundary.
5. **Logout:** the frontend calls Supabase Auth `signOut` and the session is removed.

## API authentication

The Axios instance (`frontend/src/services/api.ts`) automatically adds the logged-in user's token to every request:

```
Authorization: Bearer <access token>
```

On the backend:

- **`requireAuth`** reads that header, asks Supabase to verify the token, loads the user's profile and puts it on `req.user`. The user's identity always comes from the verified token, never from the request body.
- **`requireRole('ADMIN', 'TEAM_MEMBER')`** runs after `requireAuth` and only lets the listed roles through.

| Status | Meaning |
| --- | --- |
| `401 Unauthorized` | No token, or an invalid/expired token |
| `403 Forbidden` | Logged in, but the role is not allowed (or the user has no profile) |

### API endpoints

| Method | URL | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | Anyone | Checks that the API is running |
| GET | `/api/auth/me` | Logged in | Returns the logged-in user's profile (id, email, full name, role) |
| GET | `/api/test/protected` | Logged in | Temporary test endpoint |
| GET | `/api/test/team` | `TEAM_MEMBER`, `ADMIN` | Temporary test endpoint |
| GET | `/api/test/admin` | `ADMIN` | Temporary test endpoint |
| GET | `/api/events` | Anyone | List all events (see [Event Management](#event-management)) |
| GET | `/api/events/:id` | Anyone | One event |
| POST | `/api/events` | `ADMIN` | Create an event |
| PUT | `/api/events/:id` | `ADMIN` | Update an event |
| DELETE | `/api/events/:id` | `ADMIN` | Delete an event |

The `/api/test/*` endpoints exist only to test the role system and will be removed later.

## How to test the roles

1. Start the backend and frontend, then register a user at http://localhost:5173/register. In the Supabase dashboard, check **Authentication → Users** and **Table Editor → profiles** (role should be `PUBLIC`).
2. As `PUBLIC`: `/profile` works, `/team` and `/admin` show "Access denied".
3. In **Table Editor → profiles**, change the role to `TEAM_MEMBER`, then log out and back in: `/team` works, `/admin` is denied.
4. Change the role to `ADMIN`, log out and back in: `/team` and `/admin` both work.
5. Test the API directly. Copy your token from the browser: DevTools → **Application → Local Storage** → the `sb-...-auth-token` entry → `access_token`. Then:

   ```bash
   curl -i http://localhost:5000/api/test/admin                                        # 401
   curl -i http://localhost:5000/api/test/admin -H "Authorization: Bearer <token>"     # 403 as PUBLIC, 200 as ADMIN
   ```

## Event Management

### Database structure

`events` table (in `supabase/schema.sql`):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, generated automatically |
| `title` | text | Required |
| `description` | text | Required |
| `event_date` | date | Required, day only (`YYYY-MM-DD`) |
| `location` | text | Required |
| `cover_media_id` | uuid | Optional. Reserved for event cover media in a later phase; no foreign key yet because the media table does not exist |
| `created_by` | uuid | Required, references `profiles.id`. Set by the backend from the logged-in admin |
| `created_at` | timestamptz | Set automatically |
| `updated_at` | timestamptz | Updated automatically by a trigger |

Row Level Security is **on with no policies**: the browser cannot read or change `events` directly with the public key. All access goes through the Express API, which uses the server-only service-role key and checks permissions itself. A user who still has events cannot be deleted from the database (the `created_by` reference prevents it).

### API endpoints and permissions

| Method | URL | Logged out / `PUBLIC` / `TEAM_MEMBER` | `ADMIN` |
| --- | --- | --- | --- |
| GET | `/api/events` | ✅ | ✅ |
| GET | `/api/events/:id` | ✅ | ✅ |
| POST | `/api/events` | ❌ 401 / 403 | ✅ 201 |
| PUT | `/api/events/:id` | ❌ 401 / 403 | ✅ 200 |
| DELETE | `/api/events/:id` | ❌ 401 / 403 | ✅ 200 |

- `GET /api/events` returns upcoming events first (soonest at the top), then past events (most recent first).
- POST and PUT take this JSON body. Any other fields (such as `id` or `created_by`) are ignored:

  ```json
  { "title": "Durgamatha Festival 2026", "description": "Annual Durgamatha celebration", "event_date": "2026-10-15", "location": "Hyderabad" }
  ```

- **Validation (backend):** title, description and location are required and cannot be blank (max 150 / 5000 / 200 characters); `event_date` must be a real date in `YYYY-MM-DD` format. Invalid data returns `400` with an `errors` list.
- **Status codes:** `400` invalid data, `401` not logged in, `403` not an admin, `404` event not found (including badly formed ids), `500` unexpected server error.

### Viewing events (everyone)

- `/events` lists all events with title, date, location, a short description and a **View Details** button.
- `/events/:eventId` shows the full event, with a back button. Unknown ids show "Event not found".

### Managing events (admins)

Admins open **Admin → Manage events** (`/admin/events`), which shows a table of events with **Edit** and **Delete** actions.

- **Create:** click **Create Event** (`/admin/events/create`), fill in title, description, date and location, then **Create Event**.
- **Update:** click **Edit** next to an event (`/admin/events/:id/edit`), change the fields, then **Save Changes**.
- **Delete:** click **Delete**, then confirm in the "Delete event?" box. The list refreshes afterwards.

These admin pages are protected in the frontend with the existing `ProtectedRoute` (ADMIN only), and the backend refuses non-admin requests regardless.

## Current development phase

**Phase 1: Project foundation** (done)

- Frontend with Vite, React, TypeScript and Tailwind CSS
- Responsive layout with navigation and central Axios configuration
- Express backend with CORS, JSON parsing, error handling and a health-check endpoint
- Environment variable setup

**Phase 2: Authentication and roles** (done)

- Supabase email + password authentication with session persistence
- `profiles` table with `ADMIN` / `TEAM_MEMBER` / `PUBLIC` roles, created automatically on sign-up
- Login, register and logout; protected and role-based frontend routes
- Backend token verification (`requireAuth`) and role checks (`requireRole`)

**Phase 3: Event management** (done)

- `events` table with Row Level Security
- Event REST API with backend validation and admin-only create/update/delete
- Public event list and details pages; admin list, create, edit and delete pages

Features such as albums, media uploads and dashboards will be added in later phases.
