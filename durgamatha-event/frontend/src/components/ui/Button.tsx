import type { ComponentProps, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles'
import Spinner from './Spinner'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean // shows a spinner and disables the button
  loadingText?: string // e.g. "Saving..."
}

// The one button used across the site. type="button" by default, so it never submits a form by accident.
function Button({ variant, size, fullWidth, loading = false, loadingText, children, className = '', type = 'button', disabled, ...rest }: ButtonProps) {
  return (
    <button type={type} disabled={disabled || loading} className={`${buttonClass(variant, size, fullWidth)} ${className}`} {...rest}>
      {loading && <Spinner size="sm" />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

// A link that looks like a button (e.g. "Create Event", which opens another page)
export function ButtonLink({ variant, size, fullWidth, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={`${buttonClass(variant, size, fullWidth)} ${className}`} {...rest}>
      {children}
    </Link>
  )
}

export default Button
