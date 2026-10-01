import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

// A success message handed over from the previous page, e.g. after saving a form:
//   navigate('/admin/events', { state: { success: 'Event created successfully.' } })
// The list page shows it once; it is then removed from the browser history,
// so a page refresh does not show it again.
export function useFlashMessage() {
  const location = useLocation()
  const navigate = useNavigate()
  const handedOver = (location.state as { success?: string } | null)?.success ?? ''
  const [message, setMessage] = useState(handedOver)

  useEffect(() => {
    if (handedOver) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [handedOver, location.pathname, location.search, navigate])

  return [message, setMessage] as const
}
