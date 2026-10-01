import { buttonClass as baseButtonClass } from './ui/buttonStyles'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

// "← Previous   Page 2 of 5   Next →". Hidden when everything fits on one page.
function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null


  const buttonClass = baseButtonClass('secondary', 'sm')

  return (
    <nav aria-label="Pages" className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <button type="button" className={buttonClass} onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ← Previous
      </button>
      <span className="text-sm text-muted" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={buttonClass} onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </nav>
  )
}

export default Pagination
