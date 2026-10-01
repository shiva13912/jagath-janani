import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface PageHeaderProps {
  title: string
  subtitle?: ReactNode
  back?: { to: string; label: string } // "← Back to events"
  actions?: ReactNode // buttons on the right (below the title on phones)
}

// The same title block on every page
function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {back && <BackLink to={back.to} label={back.label} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// A back link that is tall enough to tap comfortably
export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="mb-2 -ml-2 inline-flex min-h-10 items-center rounded-lg px-2 font-medium text-primary hover:bg-primary-soft">
      ← {label}
    </Link>
  )
}

// A section heading inside a page, e.g. "Albums" or "Recent activity"
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-xl font-semibold text-ink">
      {children}
    </h2>
  )
}

export default PageHeader
