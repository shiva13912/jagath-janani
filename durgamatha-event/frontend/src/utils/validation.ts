// Small checks shared by the Login and Register forms

export const MIN_PASSWORD_LENGTH = 6 // Supabase's default minimum

export function isValidEmail(email: string): boolean {
  // Simple check: something@something.something (Supabase does the full check)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
