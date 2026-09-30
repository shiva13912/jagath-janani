import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { EventInput } from '../types/event'
import FormField from './FormField'

interface EventFormProps {
  initialValues?: EventInput
  submitLabel: string // "Create Event" or "Save Changes"
  submittingLabel: string // "Creating..." or "Saving..."
  onSubmit: (data: EventInput) => Promise<void>
}

const emptyEvent: EventInput = { title: '', description: '', event_date: '', location: '' }

// The form used by both the Create and Edit pages.
// It checks the fields before sending; the backend checks them again (the real check).
function EventForm({ initialValues = emptyEvent, submitLabel, submittingLabel, onSubmit }: EventFormProps) {
  const [values, setValues] = useState<EventInput>(initialValues)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Updates one field, e.g. setField('title', 'New title')
  function setField(field: keyof EventInput, value: string) {
    setValues({ ...values, [field]: value })
  }

  function validate(): string {
    if (!values.title.trim()) return 'Please enter a title.'
    if (!values.description.trim()) return 'Please enter a description.'
    if (!values.event_date) return 'Please choose a date.'
    if (!values.location.trim()) return 'Please enter a location.'
    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) return setError(validationError)

    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      // The page passes errors up as normal Error objects with a friendly message
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        id="title"
        label="Title"
        maxLength={150}
        value={values.title}
        onChange={(e) => setField('title', e.target.value)}
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          rows={5}
          maxLength={5000}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </div>

      <FormField
        id="event_date"
        label="Date"
        type="date"
        value={values.event_date}
        onChange={(e) => setField('event_date', e.target.value)}
      />
      <FormField
        id="location"
        label="Location"
        maxLength={200}
        value={values.location}
        onChange={(e) => setField('location', e.target.value)}
      />

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        <Link to="/admin/events" className="rounded border border-gray-300 px-5 py-2 text-center text-gray-700 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  )
}

export default EventForm
