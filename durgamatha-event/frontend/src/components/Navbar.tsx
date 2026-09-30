import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { ADMIN_ROLES, hasRole, TEAM_ROLES } from '../utils/roles'

const publicItems = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
]

// Only shown when nobody is logged in
const loggedOutItems = [
  { label: 'Login', path: '/login' },
  { label: 'Register', path: '/register' },
]

function Navbar() {
  const { isAuthenticated, user, profile, logout } = useAuth()
  const navigate = useNavigate()

  // Controls whether the menu is open on small (mobile) screens
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // NavLink tells us if its link is the current page, so we can highlight it
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'block rounded px-3 py-2 font-semibold text-orange-600'
      : 'block rounded px-3 py-2 text-gray-700 hover:text-orange-600'

  // Links for logged-in users depend on their role (only a convenience: the backend enforces access)
  const role = profile?.role
  const loggedInItems = [
    { label: 'Profile', path: '/profile' },
    ...(hasRole(role, TEAM_ROLES) ? [{ label: 'Team', path: '/team' }] : []),
    ...(hasRole(role, ADMIN_ROLES) ? [{ label: 'Admin', path: '/admin' }] : []),
  ]

  const navItems = isAuthenticated ? [...publicItems, ...loggedInItems] : [...publicItems, ...loggedOutItems]

  async function handleLogout() {
    setIsMenuOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-orange-600">
          Durgamatha Events
        </Link>

        {/* Menu button: only visible on small screens (hidden from md size up) */}
        <button
          type="button"
          className="rounded border px-3 py-1 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          Menu
        </button>

        {/* On mobile the links show only when the menu is open; on md+ screens always */}
        <ul className={`${isMenuOpen ? 'block' : 'hidden'} mt-2 w-full md:mt-0 md:flex md:w-auto md:items-center md:gap-2`}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink to={item.path} end className={linkClass} onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </NavLink>
            </li>
          ))}

          {isAuthenticated && (
            <>
              <li className="px-3 py-2 text-sm text-gray-500">
                {profile?.fullName || user?.email}
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded px-3 py-2 text-left text-gray-700 hover:text-orange-600"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
