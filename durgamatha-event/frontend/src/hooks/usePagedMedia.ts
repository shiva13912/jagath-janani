import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaPage } from '../types/media'
import { getErrorMessage } from '../utils/apiError'

// Shared by the album page and the gallery page:
// loads one page of media, and remembers which item is open in the viewer.
// "Next" on the last item of a page loads the next page and opens its first item
// (and "Previous" on the first item goes back a page), so the viewer walks through everything.
//
// loadPage must be wrapped in useCallback by the page, so it only changes when a filter changes.
export function usePagedMedia(loadPage: (page: number) => Promise<MediaPage>, page: number, setPage: (page: number) => void) {
  const [data, setData] = useState<MediaPage | null>(null) // the last page that loaded (kept while the next one loads)
  const [error, setError] = useState('')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [reloadCount, setReloadCount] = useState(0)
  // Which item to open once the next/previous page has arrived
  const openAfterLoad = useRef<'first' | 'last' | null>(null)
  // Which request finished last. While it is not the current one, we are loading.
  const [finished, setFinished] = useState<{ loadPage: typeof loadPage; page: number; reloadCount: number } | null>(null)
  const loading = finished?.loadPage !== loadPage || finished.page !== page || finished.reloadCount !== reloadCount

  useEffect(() => {
    let ignore = false // set when a newer request replaces this one, so old answers are dropped
    loadPage(page)
      .then((result) => {
        if (ignore) return
        // Page number past the end (e.g. after deleting the last item of the last page): go to the last page
        if (result.media.length === 0 && result.pagination.totalPages > 0 && page > result.pagination.totalPages) {
          setPage(result.pagination.totalPages)
          return
        }
        setData(result)
        setError('')
        if (openAfterLoad.current && result.media.length > 0) {
          setViewerIndex(openAfterLoad.current === 'first' ? 0 : result.media.length - 1)
        }
        openAfterLoad.current = null
      })
      .catch((err) => {
        if (ignore) return
        setError(getErrorMessage(err))
        setData(null)
        setViewerIndex(null)
      })
      .finally(() => {
        if (!ignore) setFinished({ loadPage, page, reloadCount })
      })
    return () => {
      ignore = true
    }
  }, [loadPage, page, setPage, reloadCount])

  const media = data?.media ?? []
  const pagination = data?.pagination ?? null

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])
  const closeViewer = useCallback(() => setViewerIndex(null), [])

  const hasPrevious = viewerIndex !== null && (viewerIndex > 0 || page > 1)
  const hasNext = viewerIndex !== null && pagination !== null && (viewerIndex < media.length - 1 || page < pagination.totalPages)

  function showPrevious() {
    if (viewerIndex === null) return
    if (viewerIndex > 0) setViewerIndex(viewerIndex - 1)
    else if (page > 1) {
      openAfterLoad.current = 'last'
      setPage(page - 1)
    }
  }

  function showNext() {
    if (viewerIndex === null || !pagination) return
    if (viewerIndex < media.length - 1) setViewerIndex(viewerIndex + 1)
    else if (page < pagination.totalPages) {
      openAfterLoad.current = 'first'
      setPage(page + 1)
    }
  }

  // "5 of 30": the item's number counted over all pages
  const position =
    viewerIndex !== null && pagination ? `${(pagination.page - 1) * pagination.limit + viewerIndex + 1} of ${pagination.total}` : ''

  return {
    media,
    pagination,
    loading,
    error,
    reload,
    viewerItem: viewerIndex !== null ? (media[viewerIndex] ?? null) : null,
    position,
    openViewer: setViewerIndex,
    closeViewer,
    showPrevious: hasPrevious ? showPrevious : null,
    showNext: hasNext ? showNext : null,
  }
}
