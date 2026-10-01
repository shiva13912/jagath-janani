import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger'

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-muted',
  primary: 'bg-primary-soft text-primary-hover',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
}

// A small label, e.g. a role ("ADMIN"), "Upcoming" or "Cover"
function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]}`}>{children}</span>
}

export default Badge
