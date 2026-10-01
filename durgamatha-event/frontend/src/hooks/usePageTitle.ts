import { useEffect } from 'react'

// Sets the browser tab title, e.g. usePageTitle('Events') -> "Durgamatha | Events"
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `Durgamatha | ${title}` : 'Durgamatha'
  }, [title])
}
