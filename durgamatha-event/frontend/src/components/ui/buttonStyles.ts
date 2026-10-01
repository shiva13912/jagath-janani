// The look of every button (kept apart from Button.tsx so it can be shared with plain links)
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'md' | 'sm'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'border border-line bg-surface text-ink hover:bg-page',
  danger: 'bg-danger text-white hover:bg-red-800',
  ghost: 'text-primary hover:bg-primary-soft',
}

// Both sizes are at least 40px tall, so they are easy to tap on a phone
const sizeClass: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-10 px-3 text-sm',
}

// The classes of a button, for the rare places that need them on another element
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', fullWidth = false): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    variantClass[variant],
    sizeClass[size],
    fullWidth ? 'w-full' : '',
  ].join(' ')
}
