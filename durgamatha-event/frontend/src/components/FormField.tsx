import type { InputHTMLAttributes } from 'react'

// A label + input pair used by the Login and Register forms.
// Any normal <input> prop (type, value, onChange, ...) is passed straight through.
interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
}

function FormField({ label, id, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
        {...inputProps}
      />
    </div>
  )
}

export default FormField
