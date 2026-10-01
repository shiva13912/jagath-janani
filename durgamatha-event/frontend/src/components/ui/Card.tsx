import type { HTMLAttributes } from 'react'

// The white box used for forms, details and panels
export const cardClass = 'rounded-xl border border-line bg-surface shadow-sm'

function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${cardClass} p-5 sm:p-6 ${className}`} {...rest} />
}

export default Card
