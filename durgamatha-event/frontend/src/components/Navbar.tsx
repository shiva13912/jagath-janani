import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { publicNav, workspaceNav, type NavItem } from '../utils/navigation'
import Badge from './ui/Badge'
import Button, { ButtonLink } from './ui/Button'

// Two rows on large screens:
//   1. public links (Home, Events, Gallery, About, Contact) and the account
//   2. "Manage" links, only for team members and admins
// Below 1024px everything moves into one menu behind the ☰ Menu button.
function Navbar() {
  const { isAuthenticated, user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const manageItems = workspaceNav(profile?.role)

  // The menu remembers on which page it was opened, so it closes by itself on any
  // page change (a link, Back, a redirect) without extra code.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null)
  const menuOpen = openOnPath === location.pathname
  const headerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Esc or a tap outside closes the menu
  useEffect(() => {
    if (!menuOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenOnPath(null)
        toggleRef.current?.focus()
      }
    }
    function onPointer(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setOpenOnPath(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  async function handleLogout() {
    setOpenOnPath(null)
    await logout()
    navigate('/login')
  }

  const displayName = profile?.fullName || user?.email || 'My account'

  return (
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg font-bold text-ink">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-lg text-white">
            ॐ
          </span>
          <span className="text-lg">
            Durgamatha<span className="hidden text-primary sm:inline"> Events</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={publicNav} />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink hover:bg-page">
                <span className="max-w-40 truncate">{displayName}</span>
                {profile && <Badge tone={profile.role === 'PUBLIC' ? 'neutral' : 'primary'}>{roleLabel(profile.role)}</Badge>}
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm">
                Login
              </ButtonLink>
              <ButtonLink to="/register" size="sm">
                Register
              </ButtonLink>
            </>
          )}
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 font-medium text-ink lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setOpenOnPath(menuOpen ? null : location.pathname)}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {menuOpen ? '✕' : '☰'}
          </span>
          Menu
        </button>
      </div>

      {/* Second row on large screens: the team/admin "Manage" links */}
      {manageItems.length > 0 && (
        <div className="hidden border-t border-line bg-page lg:block">
          <nav aria-label="Manage" className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">Manage</span>
            <NavLinks items={manageItems} compact />
          </nav>
        </div>
      )}

      {/* Phones and tablets: everything in one list */}
      {menuOpen && (
        <div id="mobile-menu" className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-line bg-surface px-4 pt-2 pb-4 lg:hidden">
          <nav aria-label="Main">
            <NavLinks items={publicNav} vertical />
          </nav>
          {manageItems.length > 0 && (
            <nav aria-label="Manage" className="mt-3 border-t border-line pt-3">
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Manage</p>
              <NavLinks items={manageItems} vertical />
            </nav>
          )}
          <div className="mt-3 border-t border-line pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link to="/profile" className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-ink hover:bg-page">
                  <span className="truncate">Signed in as {displayName}</span>
                  {profile && <Badge tone={profile.role === 'PUBLIC' ? 'neutral' : 'primary'}>{roleLabel(profile.role)}</Badge>}
                </Link>
                <Button variant="secondary" fullWidth onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <ButtonLink to="/login" variant="secondary">
                  Login
                </ButtonLink>
                <ButtonLink to="/register">Register</ButtonLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function NavLinks({ items, vertical = false, compact = false }: { items: NavItem[]; vertical?: boolean; compact?: boolean }) {
  const base = vertical
    ? 'flex min-h-11 items-center rounded-lg px-3 font-medium'
    : `inline-flex items-center rounded-lg px-3 font-medium ${compact ? 'min-h-10 text-sm' : 'min-h-10'}`
  return (
    <ul className={vertical ? 'space-y-1' : 'flex items-center gap-1'}>
      {items.map((item) => (
        <li key={item.path + item.label}>
          <NavLink
            to={item.path}
            end={item.end}
            className={({ isActive }) => `${base} ${isActive ? 'bg-primary-soft text-primary-hover' : 'text-ink hover:bg-page hover:text-primary'}`}
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function roleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'TEAM_MEMBER') return 'Team'
  return 'Member'
}

export default Navbar
