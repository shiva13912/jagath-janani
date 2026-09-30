import { Route, Routes } from 'react-router'
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../layouts/MainLayout'
import AdminEventsPage from '../pages/AdminEventsPage'
import AdminPage from '../pages/AdminPage'
import AlbumDetailsPage from '../pages/AlbumDetailsPage'
import CreateAlbumPage from '../pages/CreateAlbumPage'
import CreateEventPage from '../pages/CreateEventPage'
import EditAlbumPage from '../pages/EditAlbumPage'
import EditEventPage from '../pages/EditEventPage'
import EventDetailsPage from '../pages/EventDetailsPage'
import EventsPage from '../pages/EventsPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import ManageAlbumsPage from '../pages/ManageAlbumsPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import TeamPage from '../pages/TeamPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import { ADMIN_ROLES, TEAM_ROLES } from '../utils/roles'

// All URLs of the app live here, so it's easy to see every page in one place.
function AppRoutes() {
  return (
    <Routes>
      {/* Every page inside this Route shares the MainLayout (navbar + footer) */}
      <Route element={<MainLayout />}>
        {/* Public pages: anyone can open these */}
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/albums/:albumId" element={<AlbumDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Logged-in users only (any role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* TEAM_MEMBER and ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={TEAM_ROLES} />}>
          <Route path="/team" element={<TeamPage />} />
          {/* Album management for team members (the same pages admins use, without Delete) */}
          <Route path="/team/albums" element={<ManageAlbumsPage basePath="/team/albums" />} />
          <Route path="/team/albums/create" element={<CreateAlbumPage basePath="/team/albums" />} />
          <Route path="/team/albums/:id/edit" element={<EditAlbumPage basePath="/team/albums" />} />
        </Route>

        {/* ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/create" element={<CreateEventPage />} />
          <Route path="/admin/events/:id/edit" element={<EditEventPage />} />
          <Route path="/admin/albums" element={<ManageAlbumsPage basePath="/admin/albums" />} />
          <Route path="/admin/albums/create" element={<CreateAlbumPage basePath="/admin/albums" />} />
          <Route path="/admin/albums/:id/edit" element={<EditAlbumPage basePath="/admin/albums" />} />
        </Route>

        {/* "*" matches any URL not listed above */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
