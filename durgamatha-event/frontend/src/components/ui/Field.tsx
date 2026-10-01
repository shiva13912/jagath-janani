import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// The look of every text box, dropdown and date picker
export const inputClass =
  'block min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-gray-400 focus:border-primary disabled:bg-gray-100 disabled:text-muted aria-[invalid=true]:border-danger'

interface FieldWrapperProps {
  id: string
  label: string
  optional?: boolean // adds "(optional)" after the label
  hint?: string // a short help text under the field
  invalid?: boolean // highlights the field (the message itself is shown by the form)
  children: ReactNode
}

// Label + field + optional hint. Screen readers link the hint to the field with aria-describedby.
function FieldWrapper({ id, label, optional, hint, children }: FieldWrapperProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

type Common = Omit<FieldWrapperProps, 'children'>

function describedBy(id: string, hint?: string) {
  return hint ? `${id}-hint` : undefined
}

export function InputField({ id, label, optional, hint, invalid, className = '', ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldWrapper id={id} label={label} optional={optional} hint={hint}>
      <input id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, hint)} className={`${inputClass} ${className}`} {...rest} />
    </FieldWrapper>
  )
}

// A password box with a "Show" / "Hide" button, so users can check what they typed
export function PasswordField({ id, label, optional, hint, invalid, className = '', ...rest }: Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <FieldWrapper id={id} label={label} optional={optional} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, hint)}
          className={`${inputClass} pr-20 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-1 right-1 min-w-16 rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </FieldWrapper>
  )
}

export function SelectField({ id, label, optional, hint, invalid, className = '', children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldWrapper id={id} label={label} optional={optional} hint={hint}>
      <select id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, hint)} className={`${inputClass} ${className}`} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  )
}

export function TextareaField({ id, label, optional, hint, invalid, className = '', ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldWrapper id={id} label={label} optional={optional} hint={hint}>
      <textarea id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy(id, hint)} className={`${inputClass} ${className}`} {...rest} />
    </FieldWrapper>
  )
}

// A read-only value shown like a field (e.g. the event of an album, which can't be changed)
export function ReadOnlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <p className="rounded-lg border border-line bg-page px-3 py-2.5 text-muted">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}

// Buttons at the bottom of a form: stacked full width on phones, in a row on bigger screens
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-start [&>*]:w-full sm:[&>*]:w-auto">{children}</div>
}
