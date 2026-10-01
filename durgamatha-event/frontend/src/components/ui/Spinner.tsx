// A small turning circle. Decorative: the text next to it says what is loading.
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-4 w-4 border-2' : 'h-6 w-6 border-[3px]'
  return <span aria-hidden="true" className={`inline-block ${box} animate-spin rounded-full border-current border-r-transparent`} />
}

// "Loading events..." with a spinner, announced to screen readers
export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-3 py-10 text-muted">
      <Spinner />
      {label}
    </p>
  )
}

export default Spinner
