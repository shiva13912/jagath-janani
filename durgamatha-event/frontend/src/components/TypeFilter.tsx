import type { MediaTypeFilter } from '../types/media'
import { TYPE_OPTIONS } from '../utils/galleryParams'

// [All] [Photos] [Videos] buttons. aria-pressed tells screen readers which one is selected.
function TypeFilter({ value, onChange }: { value: MediaTypeFilter; onChange: (value: MediaTypeFilter) => void }) {
  return (
    <div role="group" aria-label="Show" className="inline-flex overflow-hidden rounded border border-gray-300 bg-white">
      {TYPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-orange-300 ${
            value === option.value ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default TypeFilter
