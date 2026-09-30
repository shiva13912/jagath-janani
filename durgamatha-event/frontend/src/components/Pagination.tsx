interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

// "← Previous   Page 2 of 5   Next →". Hidden when everything fits on one page.
function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const buttonClass =
    'rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3">
      <button type="button" className={buttonClass} onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ← Previous
      </button>
      <span className="text-sm text-gray-600" aria-current="page">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={buttonClass} onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </nav>
  )
}

export default Pagination
