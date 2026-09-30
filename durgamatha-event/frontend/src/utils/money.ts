// "10000.5" -> "₹10,000.50" (Indian grouping: ₹1,00,000.00 for one lakh).
// Negative balances show as "-₹2,250.00".
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

export function formatINR(value: string | number): string {
  return inr.format(Number(value))
}

// Short form for chart axes: ₹1.5L, ₹25K
export function formatINRShort(value: number): string {
  const size = Math.abs(value)
  if (size >= 1_00_00_000) return `₹${+(value / 1_00_00_000).toFixed(1)}Cr`
  if (size >= 1_00_000) return `₹${+(value / 1_00_000).toFixed(1)}L`
  if (size >= 1000) return `₹${+(value / 1000).toFixed(1)}K`
  return `₹${value}`
}

// The same rule the backend uses: more than 0, up to 10 digits, at most 2 decimals.
// Only a quick check for a friendly message; the backend checks again.
export function isValidAmount(text: string): boolean {
  const value = text.trim()
  return /^\d{1,10}(\.\d{1,2})?$/.test(value) && Number(value) > 0
}
