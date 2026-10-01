// Grey placeholder cards shown while a gallery page loads, in the same layout as MediaGrid,
// so the page doesn't jump when the real cards arrive
function SkeletonGrid({ count = 8, label = 'Loading gallery...' }: { count?: number; label?: string }) {
  return (
    <div role="status">
      {/* Screen readers announce this text; sighted users see the grey cards */}
      <span className="sr-only">{label}</span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className="animate-pulse overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
            <div className="aspect-square bg-gray-200" />
            <div className="m-2 h-3 w-2/3 rounded bg-gray-200" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SkeletonGrid
