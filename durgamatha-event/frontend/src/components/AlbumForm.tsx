import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import type { AlbumInput } from '../types/album'
import type { Event } from '../types/event'
import FormField from './FormField'

// Everything the form collects. eventId is only chosen when creating an album.
export interface AlbumFormValues {
  eventId: string
  name: string
  description: string
}

interface AlbumFormProps {
  // Create page: the events to choose from. Edit page: leave out, and pass eventTitle instead.
  events?: Event[]
  eventTitle?: string // shown read-only on the edit page (the event can't be changed)
  initialValues?: AlbumFormValues
  submitLabel: string // "Create Album" or "Save Changes"
  submittingLabel: string // "Creating..." or "Saving..."
  cancelTo: string // the album list to go back to
  onSubmit: (eventId: string, data: AlbumInput) => Promise<void>
}

const emptyAlbum: AlbumFormValues = { eventId: '', name: '', description: '' }

// The form used by both the Create Album and Edit Album pages.
// It checks the fields before sending; the backend checks them again (the real check).
function AlbumForm({ events, eventTitle, initialValues = emptyAlbum, submitLabel, submittingLabel, cancelTo, onSubmit }: AlbumFormProps) {
  const [values, setValues] = useState<AlbumFormValues>(initialValues)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function setField(field: keyof AlbumFormValues, value: string) {
    setValues({ ...values, [field]: value })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (events && !values.eventId) return setError('Please choose an event.')
    if (!values.name.trim()) return setError('Please enter an album name.')

    setSubmitting(true)
    try {
      // An empty description is sent as null ("no description")
      await onSubmit(values.eventId, { name: values.name, description: values.description.trim() || null })
    } catch (err) {
      // The page passes errors up as normal Error objects with a friendly message
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {events && (
        <div>
          <label htmlFor="eventId" className="mb-1 block text-sm font-medium text-gray-700">
            Event
          </label>
          <select
            id="eventId"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 focus:border-orange-500 focus:outline-none"
            value={values.eventId}
            onChange={(e) => setField('eventId', e.target.value)}
          >
            <option value="">Choose an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {eventTitle && (
        <div>
          <p className="mb-1 text-sm font-medium text-gray-700">Event</p>
          <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">{eventTitle}</p>
        </div>
      )}

      <FormField
        id="name"
        label="Album Name"
        maxLength={150}
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
      />

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea
          id="description"
          rows={4}
          maxLength={2000}
          className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
        />
      </div>

      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        <Link to={cancelTo} className="rounded border border-gray-300 px-5 py-2 text-center text-gray-700 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  )
}

export default AlbumForm
