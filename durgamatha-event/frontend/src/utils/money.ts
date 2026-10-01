// "125000" -> "₹1,25,000" and "15500.5" -> "₹15,500.50" (Indian grouping: ₹1,00,000 for one lakh).
// Paise are shown only when an amount has them. Negative balances show as "-₹2,250".
// This only changes how a number LOOKS; stored values and calculations stay exact.
const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inrPaise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatINR(value: string | number): string {
  const amount = Number(value)
  return Number.isInteger(amount) ? inrWhole.format(amount) : inrPaise.format(amount)
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
