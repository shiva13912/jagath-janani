import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import ProtectedRoute from '../components/ProtectedRoute'
import MainLayout from '../layouts/MainLayout'
import AboutPage from '../pages/AboutPage'
import AlbumDetailsPage from '../pages/AlbumDetailsPage'
import GalleryPage from '../pages/GalleryPage'
import ContactPage from '../pages/ContactPage'
import EventDetailsPage from '../pages/EventDetailsPage'
import EventsPage from '../pages/EventsPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import { ADMIN_ROLES, TEAM_ROLES } from '../utils/roles'

// Pages only team members and admins use are loaded when first opened, so public visitors
// don't download them. The dashboard also brings the large chart library (Recharts).
// While a page loads, MainLayout shows "Loading..." (its <Suspense>).
const AdminEventsPage = lazy(() => import('../pages/AdminEventsPage'))
const CreateEventPage = lazy(() => import('../pages/CreateEventPage'))
const EditEventPage = lazy(() => import('../pages/EditEventPage'))
const ManageAlbumsPage = lazy(() => import('../pages/ManageAlbumsPage'))
const CreateAlbumPage = lazy(() => import('../pages/CreateAlbumPage'))
const EditAlbumPage = lazy(() => import('../pages/EditAlbumPage'))
const FinanceListPage = lazy(() => import('../pages/FinanceListPage'))
const FinanceFormPage = lazy(() => import('../pages/FinanceFormPage'))
const TeamFinancePage = lazy(() => import('../pages/TeamFinancePage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))

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
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Logged-in users only (any role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* TEAM_MEMBER and ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={TEAM_ROLES} />}>
          {/* The old "Team Area" page now simply opens the dashboard */}
          <Route path="/team" element={<Navigate to="/team/dashboard" replace />} />
          <Route path="/team/dashboard" element={<DashboardPage area="team" />} />
          <Route path="/team/finance" element={<TeamFinancePage />} />
          {/* Album management for team members (the same pages admins use, without Delete) */}
          <Route path="/team/albums" element={<ManageAlbumsPage basePath="/team/albums" />} />
          <Route path="/team/albums/create" element={<CreateAlbumPage basePath="/team/albums" />} />
          <Route path="/team/albums/:id/edit" element={<EditAlbumPage basePath="/team/albums" />} />
        </Route>

        {/* ADMIN only */}
        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/events/create" element={<CreateEventPage />} />
          <Route path="/admin/events/:id/edit" element={<EditEventPage />} />
          <Route path="/admin/albums" element={<ManageAlbumsPage basePath="/admin/albums" />} />
          <Route path="/admin/albums/create" element={<CreateAlbumPage basePath="/admin/albums" />} />
          <Route path="/admin/albums/:id/edit" element={<EditAlbumPage basePath="/admin/albums" />} />
          <Route path="/admin/dashboard" element={<DashboardPage area="admin" />} />
          {/* key: moving between the income and expense pages starts each page fresh */}
          <Route path="/admin/income" element={<FinanceListPage key="income" kind="income" />} />
          <Route path="/admin/income/create" element={<FinanceFormPage key="income-new" kind="income" mode="create" />} />
          <Route path="/admin/income/:id/edit" element={<FinanceFormPage key="income-edit" kind="income" mode="edit" />} />
          <Route path="/admin/expenses" element={<FinanceListPage key="expenses" kind="expenses" />} />
          <Route path="/admin/expenses/create" element={<FinanceFormPage key="expenses-new" kind="expenses" mode="create" />} />
          <Route path="/admin/expenses/:id/edit" element={<FinanceFormPage key="expenses-edit" kind="expenses" mode="edit" />} />
        </Route>

        {/* "*" matches any URL not listed above */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
