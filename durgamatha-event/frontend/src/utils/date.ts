// Event dates are plain "YYYY-MM-DD" strings (no time), e.g. "2026-10-15".

// "2026-10-15" -> "15 October 2026".
// We build the date from its parts so the browser's time zone can't shift it by a day.
export function formatEventDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Today's date as "YYYY-MM-DD" in the user's own time zone
export function todayString(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
