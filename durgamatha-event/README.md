# Durgamatha Event Management Website

A web application for managing and sharing the events of Durgamatha. Visitors will be able to browse events and view event photos and videos, and organizers will be able to manage them.

The project is being built in phases. Phase 1 (project foundation), Phase 2 (authentication and roles), Phase 3 (event management), Phase 4 (album management), Phase 5 (photo and video management with Cloudinary) and Phase 6 (gallery and media viewer) are done.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Recharts, Supabase JS client |
| Backend | Node.js, Express.js, TypeScript (REST API), Supabase JS client |
| Database & Auth | Supabase PostgreSQL, Supabase Auth (email + password) |
| Media | Cloudinary (photo and video storage), Multer (receives uploads on the backend) |
| Deployment | Vercel (frontend), Render (backend), GitHub (source code) *(planned)* |

## Project structure

```
durgamatha-event/
├── frontend/                 React app (runs on http://localhost:5173)
│   ├── public/               Static files (favicon)
│   ├── src/
│   │   ├── components/       Reusable UI pieces (Navbar, FormField, ProtectedRoute, EventForm, AlbumForm, EventAlbums, AlbumCard, MediaUploader, MediaGrid, MediaCard, MediaViewer, Pagination, ...)
│   │   ├── config/           Supabase client (public key only)
│   │   ├── context/          AuthContext + AuthProvider (logged-in user state)
│   │   ├── pages/            One file per page (Home, Events, Event details, Login, Register, Profile, Admin, Gallery, Album details, admin event pages, album management pages, ...)
│   │   ├── layouts/          Shared page layout (navbar + footer)
│   │   ├── routes/           All URL routes in one place
│   │   ├── services/         API calls (Axios instance, auth, event, album, media and health services)
│   │   ├── hooks/            Custom React hooks (useAuth, usePagedMedia)
│   │   ├── types/            TypeScript types
│   │   ├── utils/            Helpers (form validation, role lists, dates, API error messages, media files and Cloudinary URLs, gallery filters)
│   │   ├── assets/           Images and other assets (empty for now)
│   │   ├── App.tsx
│   │   └── main.tsx          Entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  Express API (runs on http://localhost:5000)
│   ├── src/
│   │   ├── config/           Environment variables, Supabase admin client, Cloudinary client
│   │   ├── controllers/      Request handlers
│   │   ├── middleware/       requireAuth, requireRole, file upload (Multer), not-found and error handling
│   │   ├── routes/           API routes (all under /api)
│   │   ├── services/         Database and Cloudinary access (profiles, events, albums, media)
│   │   ├── types/            TypeScript types (roles, req.user, events, albums, media)
│   │   ├── utils/            Helpers (event, album, media file and gallery filter validation)
│   │   ├── app.ts            Creates and configures the Express app
│   │   └── server.ts         Starts the server
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/
│   └── schema.sql            Database schema: roles, profiles, events, albums, media, security rules, triggers
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
   - the `albums` table (Phase 4), linked to events, with Row Level Security turned on
   - the `media` table (Phase 5), linked to albums, with Row Level Security turned on
   - the album cover link (Phase 6): `albums.cover_media_id` → `media`, reset automatically when the cover is deleted

   If you already ran earlier parts, run only the sections you haven't run yet (for example only the **Phase 6** section at the bottom of the file).
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
| `CLOUDINARY_CLOUD_NAME` | `my-cloud` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `123456789012345` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | *(from Cloudinary)* | **Secret** Cloudinary API secret. Backend only |

> ⚠️ The service-role (secret) key bypasses all database security rules, and the Cloudinary API secret can upload and delete any file in your Cloudinary account. Keep both only in `backend/.env` (or your hosting provider's settings). Never put them in frontend code, the frontend `.env`, GitHub, or a chat message.

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
| DELETE | `/api/events/:id` | `ADMIN` | Delete an event (and its albums, photos and videos) |
| GET | `/api/albums` | Anyone | List all albums, optional `?search=` and `?eventId=` (see [Album Management](#album-management)) |
| GET | `/api/albums/:id` | Anyone | One album, with its event |
| GET | `/api/events/:eventId/albums` | Anyone | Albums of one event |
| POST | `/api/events/:eventId/albums` | `TEAM_MEMBER`, `ADMIN` | Create an album in an event |
| PUT | `/api/albums/:id` | `TEAM_MEMBER`, `ADMIN` | Update an album |
| DELETE | `/api/albums/:id` | `ADMIN` | Delete an album (and its photos and videos) |
| GET | `/api/albums/:albumId/media` | Anyone | One page of an album's photos and videos, `?page=&limit=&type=` (see [Gallery](#gallery)) |
| GET | `/api/media` | Anyone | The public gallery: one page from all albums, `?eventId=&albumId=&type=&page=&limit=` |
| PUT | `/api/albums/:id/cover` | `TEAM_MEMBER`, `ADMIN` | Set or remove the album cover |
| POST | `/api/albums/:albumId/media` | `TEAM_MEMBER`, `ADMIN` | Upload photos/videos to an album |
| GET | `/api/media/:id` | Anyone | One photo or video |
| DELETE | `/api/media/:id` | `ADMIN` | Delete a photo or video |

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
- **Delete:** click **Delete**, then confirm in the "Delete event?" box. The list refreshes afterwards. **The event's albums are deleted too** (see [Album Management](#album-management)).

These admin pages are protected in the frontend with the existing `ProtectedRoute` (ADMIN only), and the backend refuses non-admin requests regardless.

## Album Management

An album groups the photos and videos of one event. For example, the event *Durgamatha Festival 2026* can have the albums *Inauguration*, *Cultural Events*, *Food Distribution*, *Procession* and *Closing Ceremony*. Photos and videos are added to an album on its page (see [Media Management](#media-management)).

### Database structure

`albums` table (in `supabase/schema.sql`, section "PHASE 4: ALBUMS"):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, generated automatically |
| `event_id` | uuid | Required, references `events.id`. Taken from the URL when the album is created; cannot be changed afterwards |
| `name` | text | Required |
| `description` | text | Optional (`NULL` when empty) |
| `cover_media_id` | uuid | Optional. The album's cover photo/video (references `media.id`, `ON DELETE SET NULL`). See [Album covers](#album-covers) |
| `created_by` | uuid | Required, references `profiles.id`. Set by the backend from the logged-in user |
| `created_at` | timestamptz | Set automatically |
| `updated_at` | timestamptz | Updated automatically by a trigger |

Row Level Security is **on with no policies**, exactly like `events`: only the Express API can read or change albums.

### Event → Album relationship

```
events (1) ────────< albums (many)
  Durgamatha Festival 2026
    ├── Inauguration
    ├── Cultural Events
    └── Procession
```

- Each album belongs to exactly one event (`albums.event_id`); an event can have many albums.
- `event_id` uses **`ON DELETE CASCADE`**: deleting an event also deletes its albums, so an album can never point to an event that no longer exists. Photos and videos are also removed: before the database delete, the backend deletes the files from Cloudinary (see [Deleting media](#deleting-media)).

### API endpoints and permissions

| Method | URL | Logged out / `PUBLIC` | `TEAM_MEMBER` | `ADMIN` |
| --- | --- | --- | --- | --- |
| GET | `/api/albums` | ✅ | ✅ | ✅ |
| GET | `/api/albums/:id` | ✅ | ✅ | ✅ |
| GET | `/api/events/:eventId/albums` | ✅ | ✅ | ✅ |
| POST | `/api/events/:eventId/albums` | ❌ 401 / 403 | ✅ 201 | ✅ 201 |
| PUT | `/api/albums/:id` | ❌ 401 / 403 | ✅ 200 | ✅ 200 |
| DELETE | `/api/albums/:id` | ❌ 401 / 403 | ❌ 403 | ✅ 200 |

- `GET /api/albums` returns all albums, newest first. `GET /api/albums` and `GET /api/albums/:id` include the album's `event` (`id`, `title`, `event_date`, `location`) and `creator` (display name only, never email or role).
- `GET /api/events/:eventId/albums` returns the albums of one event in the order they were created, or `404` if the event does not exist.
- POST and PUT take this JSON body. Any other fields (`id`, `event_id`, `created_by`, `created_at`, `updated_at`, ...) are ignored:

  ```json
  { "name": "Cultural Events", "description": "Photos and videos from cultural programs" }
  ```

- **Validation (backend):** `name` is required and cannot be blank (max 150 characters); `description` is optional (max 2000 characters; empty means `NULL`). Invalid data returns `400` with an `errors` list.
- **Status codes:** `400` invalid data, `401` not logged in, `403` role not allowed, `404` album or event not found (including badly formed ids), `500` unexpected server error.
- Permissions are enforced by the backend (`requireAuth` + `requireRole`), whatever the frontend shows.

### How albums appear under events (everyone)

- `/events/:eventId` has an **Albums** section with a card per album (its cover image, or a placeholder when no cover is chosen) and a **View Album** link. With no albums it says "No albums available for this event yet."
- `/albums/:albumId` shows the album name and description, its event, the event date and location, and its photos and videos page by page (see [Album gallery](#album-gallery-albumsalbumid)). Unknown ids show "Album not found".

### Managing albums

Admins use **Admin → Manage albums** (`/admin/albums`). Team members use **Team → Manage albums** (`/team/albums`), which is the same page without the Delete button. The table shows Album, Event, Created By, Created At and Actions.

- **Create an album:** click **Create Album**, choose the **Event** from the dropdown, enter the **Album Name** and an optional **Description**, then **Create Album**. (An event must exist first.)
- **Edit an album:** click **Edit**, change the name or description, then **Save Changes**. The event is shown but cannot be changed.
- **Delete an album (admins only):** click **Delete**, then confirm in the "Delete album?" box.

### How to test album permissions

1. Run the **Phase 4** section of `supabase/schema.sql` in the Supabase SQL Editor.
2. **Admin:** create two albums in one event and one in another; edit one; delete one (cancel the confirmation once first). Delete an event and check its albums disappear from `/admin/albums`.
3. **Team member** (change the role in **Table Editor → profiles**, then log out and back in): `/team/albums` works, you can create and edit, there is no Delete button, and `/admin/albums` shows "Access denied".
4. **Public user / logged out:** you can see albums on event pages and album pages, but `/team/albums` and `/admin/albums` are denied (or send you to login).
5. **API directly** (token from DevTools → Application → Local Storage → `sb-...-auth-token` → `access_token`):

   ```bash
   curl -i http://localhost:5000/api/albums                                                   # 200 for anyone
   curl -i -X POST http://localhost:5000/api/events/<event-id>/albums \
     -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"name":"Procession"}'
                                                                                              # 401 no token, 403 PUBLIC, 201 TEAM_MEMBER/ADMIN
   curl -i -X DELETE http://localhost:5000/api/albums/<album-id> -H "Authorization: Bearer <token>"
                                                                                              # 403 TEAM_MEMBER, 200 ADMIN
   ```

## Media Management

Photos and videos belong to an album. Team members and admins upload them on the album page, and everyone can view them there.

Actual image/video files are stored in Cloudinary. PostgreSQL stores only media metadata and Cloudinary references.

```
events (1) ───< albums (1) ───< media (row in PostgreSQL) ────> file in Cloudinary
```

### Cloudinary setup

1. Create a free account at https://cloudinary.com.
2. On the Cloudinary **Dashboard** (or **Settings → API Keys**) copy the **Cloud name**, **API Key** and **API Secret**.
3. Put them in `backend/.env` (never in the frontend):

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. Restart the backend. It refuses to start if one of the three is missing.

Files are stored in Cloudinary in the folder `durgamatha/events/{eventId}/albums/{albumId}`, so every album's files stay together.

### Database structure

`media` table (in `supabase/schema.sql`, section "PHASE 5: MEDIA"):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, generated automatically |
| `album_id` | uuid | Required, references `albums.id` (`ON DELETE CASCADE`) |
| `uploaded_by` | uuid | Required, references `profiles.id`. Set by the backend from the logged-in user |
| `cloudinary_public_id` | text | Cloudinary's id for the file, needed to delete it. Unique |
| `secure_url` | text | The https URL of the file |
| `resource_type` | text | `image` or `video` |
| `format` | text | `jpg`, `png`, `webp`, `mp4`, `webm` or `mov` |
| `original_filename` | text | The file's name on the uploader's computer |
| `file_size` | bigint | Size in bytes |
| `width`, `height` | integer | Pixels (when Cloudinary reports them) |
| `duration` | numeric | Seconds, videos only |
| `created_at`, `updated_at` | timestamptz | Set automatically (`updated_at` by a trigger) |

Row Level Security is **on with no policies**, like `events` and `albums`: only the Express API can read or change media.

### Supported files and limits

| Kind | Formats | Max size |
| --- | --- | --- |
| Photo | JPG / JPEG, PNG, WEBP | 10 MB |
| Video | MP4, WEBM, MOV | 100 MB |

- At most **10 files** per upload request.
- The file extension **and** the browser-reported type must both match. After the upload, the backend also checks the type Cloudinary actually detected, so a text file renamed to `.jpg` is rejected and removed.
- The frontend checks the same rules before uploading, but the backend always checks again.

### How uploading works

1. On `/albums/:albumId`, a team member or admin drags files onto the **Upload Photos/Videos** box (or clicks it to choose files). Each file is listed with its size and is marked "Ready" or with the reason it can't be uploaded.
2. **Upload** sends the files **one at a time** with Axios, so each file shows its real progress bar. When a file reaches 100% it shows "processing..." while the backend sends it on to Cloudinary.
3. The backend (Multer) saves the file in the server's temporary folder, uploads it to Cloudinary, saves a `media` row, and **always deletes the temporary file**. Nothing is kept on the Express server.
4. If saving the row fails after the Cloudinary upload, the backend deletes the new Cloudinary file again so no unused file is left. (If even that fails, the server logs "ORPHANED CLOUDINARY FILE" with the public id so it can be removed by hand.)
5. When all files are done, the album page shows page 1 of All, where the new files are (newest first). Files that failed keep their error message.

### API endpoints and permissions

| Method | URL | Logged out / `PUBLIC` | `TEAM_MEMBER` | `ADMIN` |
| --- | --- | --- | --- | --- |
| GET | `/api/albums/:albumId/media` (paginated, see [Gallery](#pagination)) | ✅ | ✅ | ✅ |
| GET | `/api/media/:id` | ✅ | ✅ | ✅ |
| POST | `/api/albums/:albumId/media` | ❌ 401 / 403 | ✅ 201 | ✅ 201 |
| DELETE | `/api/media/:id` | ❌ 401 / 403 | ❌ 403 | ✅ 200 |

- **Upload:** `multipart/form-data` with the files in the field `files`. The response is `201` with `media` (the saved items) and `errors` (the files that failed, with a reason). If no file succeeded, it is `400`.
- **Status codes:** `400` invalid or missing files, `401` not logged in, `403` role not allowed, `404` album or media not found, `413` file larger than 100 MB, `502` Cloudinary could not delete the files.
- `uploaded_by`, `album_id` and the Cloudinary fields always come from the server, never from the request.

### Deleting media

- **One photo or video (admins only):** open it in the viewer, click **Delete** and confirm. The backend deletes the file from **Cloudinary first**, then the `media` row. If Cloudinary fails, the row is kept and the page shows "Could not delete the files from Cloudinary. Nothing was deleted, please try again.", so the database never points to a missing file without you knowing.
- **An album or event:** before deleting it, the backend deletes all its files from Cloudinary. If that fails, nothing is deleted (`502`). Then the database delete removes the album(s) and, through `ON DELETE CASCADE`, their `media` rows.

### How to test uploads and deletion

1. Run the **Phase 5** section of `supabase/schema.sql` in the Supabase SQL Editor, and add the three Cloudinary values to `backend/.env`.
2. **Team member:** open an album, upload a JPG, a PNG and a short MP4 together. Watch the progress bars, then check the grid, the Cloudinary **Media Library** (folder `durgamatha/events/...`) and the `media` table in Supabase.
3. Try a GIF, a PDF and a photo over 10 MB: each is marked as not allowed and is not uploaded. There is no Delete button.
4. **Admin:** delete a photo (cancel once first). It disappears from the page, the Cloudinary Media Library and the `media` table. Delete an album with photos and check its files are gone from Cloudinary.
5. **Logged out / `PUBLIC`:** the photos and videos are visible, but there is no upload panel and no Delete button in the viewer.
6. **API directly:**

   ```bash
   curl -i -X POST http://localhost:5000/api/albums/<album-id>/media \
     -H "Authorization: Bearer <token>" -F "files=@photo.jpg" -F "files=@clip.mp4"
                                                                     # 401 no token, 403 PUBLIC, 201 TEAM_MEMBER/ADMIN
   curl -i -X DELETE http://localhost:5000/api/media/<media-id> -H "Authorization: Bearer <token>"
                                                                     # 403 TEAM_MEMBER, 200 ADMIN
   ```

## Gallery

Anyone can browse photos and videos, with no login needed. Team members and admins also manage media and album covers from the same pages. As in Phase 5, the files stay in Cloudinary and PostgreSQL stores only their metadata and Cloudinary references.

### Gallery page (`/gallery`)

The **Gallery** link in the menu opens a page with two tabs:

- **Photos & Videos:** every photo and video, newest first, 24 per page.
  - Filters: **Event**, **Album** (only the chosen event's albums) and **All / Photos / Videos**.
  - **Clear filters** resets them.
  - Each card is captioned with its album name.
- **Albums** (`/gallery?tab=albums`): album cards with their cover, event and a **View Album** link.
  - The **Search albums...** box finds albums by name. It is case-insensitive, and it searches 300 ms after you stop typing.
  - An **Event** filter narrows the list.

Filters and the page number are kept in the URL (for example `/gallery?event=<id>&type=video&page=2`), so the browser's Back button and shared links keep them.

### Album gallery (`/albums/:albumId`)

The album page shows the album name and description, the event, its date and location, and then the album's photos and videos.
- They are newest first, 24 per page, with an **All / Photos / Videos** filter and **Previous / Next** pages.
- Team members and admins also see the Phase 5 upload panel. After an upload, the page jumps to page 1, where the new files are.

The grid has 2 columns on phones, 3 on tablets, 4 on laptops and 5 on large screens. Videos show a still frame with a ▶ badge and their length, and **never autoplay** in the grid.

### Media viewer

Clicking a card opens a fullscreen viewer:
- **Photos** are shown fitted to the screen.
- **Videos** get a normal player that only starts when you press play.

| Control | What it does |
| --- | --- |
| **✕ / Close**, or **Esc** | Closes the viewer and returns focus to the card |
| **‹ ›** buttons, or **← →** keys | Previous / next item. At the end of a page, the next page is loaded automatically |
| **Download** | Downloads the original file (see below) |
| **Set as album cover** | Team members and admins (album page) |
| **Delete** | Admins only (album page), after "Are you sure you want to delete this media?" |

Below the picture, the viewer shows:
- the file name and position ("5 of 30");
- the type, dimensions, size, video length and upload date;
- in the gallery, a link to the item's album.

Internal ids and keys are never shown.

### Pagination

`GET /api/albums/:albumId/media` and `GET /api/media` return one page at a time:

```json
{
  "success": true,
  "media": [ ... ],
  "pagination": { "page": 1, "limit": 24, "total": 100, "totalPages": 5 }
}
```

- `page` starts at 1 and `limit` defaults to 24, with a **maximum of 60**, so nobody can ask for thousands of items at once.
- `page=0`, `page=abc`, `limit=61` or `limit=0` return **400** "Invalid filter" with an `errors` list.
- A page after the last one returns an empty list with the real `total`. The frontend then jumps to the last page.
- The backend uses Supabase's `range()` to ask PostgreSQL for only those rows, and `count: 'exact'` to get the total in the same request.

### Filtering and search

| Endpoint | Query parameters |
| --- | --- |
| `GET /api/albums/:albumId/media` | `page`, `limit`, `type` (`image` or `video`) |
| `GET /api/media` | `page`, `limit`, `type`, `eventId`, `albumId` |
| `GET /api/albums` | `search` (part of the name), `eventId` |

- **Invalid values return 400:** `type=abc`, or a badly formed `eventId` or `albumId`.
- **Valid ids that match nothing** simply return an empty list.
- **How `eventId` works:** the backend finds that event's album ids, then selects media in those albums.
- **How `search` works:** it is a simple PostgreSQL `ilike '%text%'`. The characters `%`, `_` and `*` are removed first, so they are searched as plain text rather than acting as wildcards. There is no search engine.

### Lazy loading and Cloudinary transformations

- **Lazy loading.** Grid images use the browser's `loading="lazy"`. On a phone, only the cards near the screen are downloaded, and the rest load as you scroll.
- **Transformations.** The grid never downloads original files. The frontend builds Cloudinary URLs with **transformations** (`frontend/src/utils/mediaFiles.ts`), put right after `/upload/` in the stored `secure_url`:

| Use | Transformation | Meaning |
| --- | --- | --- |
| Photo card | `c_fill,w_400,h_400,q_auto,f_auto` | Crop to a 400×400 square, automatic quality and format (e.g. WebP) |
| Video card | `so_0,c_fill,w_400,h_400,q_auto` + `.jpg` | A still picture of the frame at 0 seconds |
| Photo in viewer | `c_limit,w_1600,h_1600,q_auto,f_auto` | At most 1600 px, never enlarged |
| Video poster in viewer | `so_0,c_limit,w_1600,q_auto` + `.jpg` | Still frame shown before playing |
| Download | `fl_attachment:<name>` | The original file, sent as a download |

Cloudinary creates each version the first time it is asked for and then caches it. The `secure_url` stored in PostgreSQL is **never changed**; these URLs are only built for display.

### Downloads

**Download** is a normal link to `…/upload/fl_attachment:<file-name>/…` on Cloudinary. Cloudinary sends the original file with a "save as" header, so:

- the file goes **straight from Cloudinary to the browser, never through the Express server**;
- the link contains no API key, secret or signature, because it is the same public delivery URL used to show the file;
- anyone who can view the gallery can download, including logged-out visitors.

### Album covers

- **Choosing a cover:** in the viewer on an album page, **Set as album cover** calls `PUT /api/albums/:id/cover` with `{ "media_id": "<id>" }`. **Remove as album cover** sends `{ "media_id": null }`.
  - The photo or video must belong to that album; otherwise the answer is 400.
  - Videos can be covers too; their still frame is shown.
- **Showing covers:** album lists (`GET /api/albums`, `GET /api/albums/:id`, `GET /api/events/:eventId/albums`) include `cover: { id, secure_url, resource_type }` in the **same query**, so a page of album cards needs one request, not one per album.
  - Cards without a cover show a simple placeholder.
- **Deleting the cover photo:** the database resets the cover by itself. `albums.cover_media_id` references `media(id)` with **`ON DELETE SET NULL`** (the "PHASE 6" section of `schema.sql`), so an album can never point to a deleted photo.

### Permissions

| | Logged out / `PUBLIC` | `TEAM_MEMBER` | `ADMIN` |
| --- | --- | --- | --- |
| View gallery, albums, viewer | ✅ | ✅ | ✅ |
| Download | ✅ | ✅ | ✅ |
| Upload (Phase 5) | ❌ 401 / 403 | ✅ | ✅ |
| Set or remove album cover | ❌ 401 / 403 | ✅ | ✅ |
| Delete media | ❌ 401 / 403 | ❌ 403 | ✅ |

Setting a cover counts as editing the album, so it follows the album-edit permission. The backend checks every rule (`requireAuth` + `requireRole`); the frontend only hides the buttons.

### How to test the gallery

1. Run the **Phase 6** section of `supabase/schema.sql` in the Supabase SQL Editor.
2. **Logged out:**
   - Open **Gallery**, then try the Event, Album and Photos/Videos filters and the page buttons.
   - Open a photo, use ← → and Esc, and click **Download**.
   - Open a video: it only plays when you press play.
3. **Albums tab:** search for part of an album name.
4. **Team member:**
   - On an album page, open a photo and click **Set as album cover**.
   - The album's card on the event page and in the Albums tab now shows it. There is no Delete button.
5. **Admin:**
   - Delete the cover photo (cancel once first).
   - The card goes back to the placeholder, and `albums.cover_media_id` is `NULL` in Supabase.
6. **Phone:** in DevTools device mode, check that the gallery has 2 columns and that the viewer fits the screen with easy-to-tap buttons.
7. **API:**

   ```bash
   curl "http://localhost:5000/api/albums/<album-id>/media?page=1&limit=24&type=image"   # 200 with pagination
   curl "http://localhost:5000/api/albums/<album-id>/media?type=abc"                     # 400
   curl "http://localhost:5000/api/media?eventId=<event-id>&type=video"                  # gallery filter
   curl "http://localhost:5000/api/albums?search=proc"                                   # album search
   curl -X PUT http://localhost:5000/api/albums/<album-id>/cover -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" -d '{"media_id":"<media-id>"}'                  # 403 PUBLIC, 200 TEAM_MEMBER/ADMIN
   ```

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

**Phase 4: Album management** (done)

- `albums` table linked to events (`ON DELETE CASCADE`), with Row Level Security
- Album REST API with backend validation: public reads, team members and admins create/update, admins delete
- Albums section on the event page, a public album page, and album management pages for admins (`/admin/albums`) and team members (`/team/albums`)

**Phase 5: Photo and video management** (done)

- Photos and videos stored in Cloudinary; the `media` table stores only their metadata and Cloudinary references
- Upload API for team members and admins (type and size checks, up to 10 files per request); admin-only delete
- Upload panel with drag and drop and real progress on the album page, and a lazy-loaded photo/video grid

**Phase 6: Gallery and media experience** (done)

- Public `/gallery` with event, album and type filters, pagination and album search
- Album gallery with a paged grid, a fullscreen photo/video viewer (keyboard and mobile friendly) and direct Cloudinary downloads
- Optimised Cloudinary thumbnails, lazy loading, no autoplay
- Album covers, reset automatically when the cover photo is deleted

Features such as dashboards and deployment will be added in later phases.
