import type { MediaTypeFilter } from '../types/media'
import { TYPE_OPTIONS } from '../utils/galleryParams'

// [All] [Photos] [Videos] buttons. aria-pressed tells screen readers which one is selected.
function TypeFilter({ value, onChange }: { value: MediaTypeFilter; onChange: (value: MediaTypeFilter) => void }) {
  return (
    <div role="group" aria-label="Show" className="inline-flex overflow-hidden rounded-lg border border-line bg-surface">
      {TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 px-4 text-sm font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-300 ${
            value === option.value ? 'bg-primary text-white' : 'text-ink hover:bg-page'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TypeFilter
