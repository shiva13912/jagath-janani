import { isAxiosError } from 'axios'

// Turns any error from an API call into a short message that is safe to show to users.
// Raw server/database details are never shown.
export function getErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) return 'Something went wrong. Please try again.'

  // No response at all: backend down or no internet
  if (!error.response) return 'Cannot reach the server. Please check your connection and try again.'

  const data = error.response.data as { message?: string; errors?: string[] } | undefined

  switch (error.response.status) {
    case 400:
      // Validation errors from the backend are written for users, so we can show them
      return data?.errors?.join(' ') || data?.message || 'Some of the information is not valid.'
    case 401:
      return 'Your session has expired. Please log in again.'
    case 403:
      return 'You do not have permission to do this.'
    case 404:
      return 'The requested item was not found.'
    default:
      return 'Something went wrong on the server. Please try again later.'
  }
}

// true if the error is a 404 from the API (used to show a "not found" page)
export function isNotFoundError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}
