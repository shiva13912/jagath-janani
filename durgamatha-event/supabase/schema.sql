-- =====================================================================
-- Durgamatha Event Management - database schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Step 3: roles and the profiles table
-- ---------------------------------------------------------------------

-- The only roles that exist. Postgres rejects any other value.
create type public.user_role as enum ('ADMIN', 'TEAM_MEMBER', 'PUBLIC');

-- One row per user with app-specific information.
-- Passwords are NOT stored here: Supabase Auth keeps them (hashed) in auth.users.
create table public.profiles (
  -- Same id as the Supabase Auth user. If the auth user is deleted, the profile is deleted too.
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  role        public.user_role not null default 'PUBLIC',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at correct automatically whenever a row changes.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Row Level Security: with RLS on, nobody using the public (anon) key can
-- touch this table unless a policy below allows it.
alter table public.profiles enable row level security;

-- A logged-in user may READ only their own profile.
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- There are deliberately NO insert, update or delete policies.
-- So from the browser nobody can create a profile, change a role, or delete a row.
-- Profiles are created by the signup trigger (Step 4), and roles are changed
-- only by an admin (for now: by hand in the Supabase Table Editor).


-- ---------------------------------------------------------------------
-- Step 4: create a profile automatically when a user signs up
-- ---------------------------------------------------------------------

-- Runs inside the database every time Supabase Auth adds a row to auth.users.
-- "security definer" lets it insert into profiles even though users themselves
-- have no insert permission (see the RLS section above).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    -- full_name comes from the register form (sent as user metadata)
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- Always PUBLIC. Any "role" a user sneaks into the signup metadata is ignored.
    'PUBLIC'
  );
  return new;
end;
$$;

-- Only the trigger should run this function, not users calling it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- Phase 3: events
-- =====================================================================

-- ---------------------------------------------------------------------
-- Step 2: the events table
-- ---------------------------------------------------------------------

create table public.events (
  -- gen_random_uuid() creates a new random id automatically for each event
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  -- DATE only (no time), e.g. 2026-10-15
  event_date      date not null,
  location        text not null,
  -- Will point to a media record in the Cloudinary phase.
  -- No foreign key yet, because the media table does not exist yet.
  cover_media_id  uuid,
  -- The admin who created the event. The backend fills this in from the logged-in user.
  -- A user who still has events cannot be deleted (the database refuses), so we never lose track of the creator.
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Speeds up sorting and filtering events by date
create index events_event_date_idx on public.events (event_date);

-- Reuse the updated_at function from Phase 2
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Step 3: security for events
-- ---------------------------------------------------------------------

-- Our app reads and writes events ONLY through the Express backend, which uses the
-- service-role key. That key bypasses RLS, and the backend itself checks who is
-- allowed to do what (requireAuth + requireRole).
--
-- We still turn RLS on, with NO policies. That means anyone calling Supabase
-- directly with the public anon key (for example from the browser console)
-- cannot read, create, change or delete events. The only way in is our API.
alter table public.events enable row level security;

-- =====================================================================
-- PHASE 4: ALBUMS
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran the Phase 2 and Phase 3 sections, run ONLY this part.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Albums table
-- ---------------------------------------------------------------------

-- An album groups the photos and videos of ONE event, e.g. "Inauguration" or
-- "Cultural Events". One event can have many albums (Event 1 ──── * Albums).
-- In this phase an album holds only its own information; media comes in Phase 5.
create table public.albums (
  id              uuid primary key default gen_random_uuid(),
  -- The event this album belongs to. Required: every album belongs to exactly one event.
  -- "on delete cascade": when an event is deleted, the database deletes its albums too,
  -- so an album can never point to an event that no longer exists.
  event_id        uuid not null references public.events (id) on delete cascade,
  name            text not null,
  -- Optional: NULL when the album has no description
  description     text,
  -- The album's cover photo/video. The foreign key to media is added in the
  -- Phase 6 section at the bottom, because the media table is created later.
  cover_media_id  uuid,
  -- The admin or team member who created the album. The backend fills this in from the logged-in user.
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Speeds up "all albums of this event", the most common album query
create index albums_event_id_idx on public.albums (event_id);

-- Reuse the updated_at function from Phase 2
create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Security for albums
-- ---------------------------------------------------------------------

-- Same as events: RLS on with NO policies, so nobody can use the public anon key
-- to read or change albums directly. Only our Express backend (service-role key) can.
alter table public.albums enable row level security;

-- =====================================================================
-- PHASE 5: MEDIA (photos and videos)
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran Phases 2-4, run ONLY this part.)
--
-- The actual image/video files are stored in Cloudinary.
-- This table stores only metadata and the Cloudinary references (public id + URL),
-- never the files themselves.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Media table
-- ---------------------------------------------------------------------

-- events 1 ──── * albums 1 ──── * media ──── Cloudinary file
create table public.media (
  id                    uuid primary key default gen_random_uuid(),
  -- The album this photo/video belongs to. Every media item belongs to exactly one album.
  -- "on delete cascade": deleting an album deletes its media ROWS. The backend deletes
  -- the Cloudinary FILES first, because the database cannot reach Cloudinary.
  album_id              uuid not null references public.albums (id) on delete cascade,
  -- Who uploaded it. The backend fills this in from the logged-in user.
  uploaded_by           uuid not null references public.profiles (id),
  -- Cloudinary's id for the file, e.g. "durgamatha/events/<id>/albums/<id>/abc123".
  -- Needed to delete the file later. Unique: one row per Cloudinary file.
  cloudinary_public_id  text not null unique,
  -- The https URL used to show the photo/video
  secure_url            text not null,
  resource_type         text not null check (resource_type in ('image', 'video')),
  format                text not null,             -- e.g. jpg, png, webp, mp4, webm, mov
  original_filename     text not null,             -- the name of the file on the uploader's computer
  file_size             bigint not null,           -- in bytes
  width                 integer,                   -- pixels (images and most videos)
  height                integer,
  duration              numeric,                   -- seconds, videos only
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Speeds up "all media of this album", the query used by the album page
create index media_album_id_idx on public.media (album_id);

-- Reuse the updated_at function from Phase 2
create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Security for media
-- ---------------------------------------------------------------------

-- Same as events and albums: RLS on with NO policies, so only our Express backend
-- (service-role key) can read or change media rows.
alter table public.media enable row level security;

-- =====================================================================
-- PHASE 6: GALLERY (album covers)
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran Phases 2-5, run ONLY this part.)
-- =====================================================================

-- albums.cover_media_id (added in Phase 4) now points to a real photo/video.
-- "on delete set null": when the cover photo is deleted, PostgreSQL itself sets the
-- album's cover back to NULL, so an album can never point to a deleted photo.
alter table public.albums
  add constraint albums_cover_media_id_fkey
  foreign key (cover_media_id) references public.media (id) on delete set null;
