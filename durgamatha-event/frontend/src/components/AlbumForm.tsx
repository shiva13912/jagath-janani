import { useState, type FormEvent } from 'react'
import type { AlbumInput } from '../types/album'
import type { Event } from '../types/event'
import Alert from './ui/Alert'
import Button, { ButtonLink } from './ui/Button'
import { FormActions, InputField, ReadOnlyField, SelectField, TextareaField } from './ui/Field'

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
  const [badField, setBadField] = useState<keyof AlbumFormValues | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function setField(field: keyof AlbumFormValues, value: string) {
    setValues({ ...values, [field]: value })
  }

  function fail(field: keyof AlbumFormValues, message: string) {
    setError(message)
    setBadField(field)
    document.getElementById(field)?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBadField(null)

    if (events && !values.eventId) return fail('eventId', 'Please choose an event.')
    if (!values.name.trim()) return fail('name', 'Please enter an album name.')

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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {events && (
        <SelectField id="eventId" label="Event" value={values.eventId} invalid={badField === 'eventId'} onChange={(e) => setField('eventId', e.target.value)}>
          <option value="">Choose an event</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </SelectField>
      )}

      {eventTitle && <ReadOnlyField label="Event" value={eventTitle} hint="An album always stays with its event." />}

      <InputField
        id="name"
        label="Album Name"
        maxLength={150}
        value={values.name}
        invalid={badField === 'name'}
        onChange={(e) => setField('name', e.target.value)}
      />
      <TextareaField
        id="description"
        label="Description"
        optional
        rows={4}
        maxLength={2000}
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <FormActions>
        <Button type="submit" loading={submitting} loadingText={submittingLabel}>
          {submitLabel}
        </Button>
        <ButtonLink to={cancelTo} variant="secondary">
          Cancel
        </ButtonLink>
      </FormActions>
    </form>
  )
}

export default AlbumForm
