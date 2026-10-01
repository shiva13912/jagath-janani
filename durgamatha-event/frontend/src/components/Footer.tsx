import { Link } from 'react-router'
import { hasContactDetails, siteInfo } from '../config/siteInfo'

const currentYear = new Date().getFullYear()

const links = [
  { label: 'Events', path: '/events' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
]

// The same footer on every page
function Footer() {
  const { email, phone } = siteInfo.contact
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-bold text-ink">{siteInfo.name}</p>
          <p className="mt-2 text-sm text-muted">{siteInfo.tagline}</p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold text-ink">Explore</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {links.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="inline-flex min-h-8 items-center text-muted hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {hasContactDetails() && (
          <div className="text-sm">
            <p className="font-semibold text-ink">Contact</p>
            {email && (
              <a href={`mailto:${email}`} className="mt-2 block text-muted hover:text-primary">
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="mt-1 block text-muted hover:text-primary">
                {phone}
              </a>
            )}
          </div>
        )}
      </div>
      <p className="border-t border-line py-4 text-center text-sm text-muted">
        © {currentYear} {siteInfo.name}
      </p>
    </footer>
  )
}

export default Footer
