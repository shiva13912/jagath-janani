import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../utils/apiError'

interface Result<T> {
  load: () => Promise<T> // which request this answer belongs to
  version: number
  data: T | null
  error: string
}

// Runs an API call and keeps its result, error and loading state.
// `load` must come from useCallback: when it changes (e.g. another event was picked),
// the call runs again. While a call is running, `data` is null, so a page never shows
// the previous event's numbers (or zeros) as if they were the new ones.
export function useApiData<T>(load: () => Promise<T>) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)

  useEffect(() => {
    let ignore = false // an answer that arrives after the user moved on is dropped
    load()
      .then((data) => {
        if (!ignore) setResult({ load, version, data, error: '' })
      })
      .catch((err) => {
        if (!ignore) setResult({ load, version, data: null, error: getErrorMessage(err) })
      })
    return () => {
      ignore = true
    }
  }, [load, version])

  // Loading = the last answer is for an older request (derived, not stored)
  const loading = !result || result.load !== load || result.version !== version
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { data: loading ? null : result.data, error: loading ? '' : result.error, loading, reload }
}
