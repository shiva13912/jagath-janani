import { useState, type FormEvent } from 'react'
import type { EventInput } from '../types/event'
import Alert from './ui/Alert'
import Button, { ButtonLink } from './ui/Button'
import { FormActions, InputField, TextareaField } from './ui/Field'

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
  const [badField, setBadField] = useState<keyof EventInput | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Updates one field, e.g. setField('title', 'New title')
  function setField(field: keyof EventInput, value: string) {
    setValues({ ...values, [field]: value })
  }

  // The first field with a problem and its message, or null
  function validate(): { field: keyof EventInput; message: string } | null {
    if (!values.title.trim()) return { field: 'title', message: 'Please enter a title.' }
    if (!values.description.trim()) return { field: 'description', message: 'Please enter a description.' }
    if (!values.event_date) return { field: 'event_date', message: 'Please choose a date.' }
    if (!values.location.trim()) return { field: 'location', message: 'Please enter a location.' }
    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBadField(null)

    const problem = validate()
    if (problem) {
      setError(problem.message)
      setBadField(problem.field)
      document.getElementById(problem.field)?.focus()
      return
    }

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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <InputField
        id="title"
        label="Title"
        maxLength={150}
        value={values.title}
        invalid={badField === 'title'}
        onChange={(e) => setField('title', e.target.value)}
      />
      <TextareaField
        id="description"
        label="Description"
        rows={5}
        maxLength={5000}
        value={values.description}
        invalid={badField === 'description'}
        onChange={(e) => setField('description', e.target.value)}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="event_date"
          label="Date"
          type="date"
          value={values.event_date}
          invalid={badField === 'event_date'}
          onChange={(e) => setField('event_date', e.target.value)}
        />
        <InputField
          id="location"
          label="Location"
          maxLength={200}
          value={values.location}
          invalid={badField === 'location'}
          onChange={(e) => setField('location', e.target.value)}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <FormActions>
        <Button type="submit" loading={submitting} loadingText={submittingLabel}>
          {submitLabel}
        </Button>
        <ButtonLink to="/admin/events" variant="secondary">
          Cancel
        </ButtonLink>
      </FormActions>
    </form>
  )
}

export default EventForm
