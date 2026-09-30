import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { deleteAlbum, getAlbums } from '../services/albumService'
import type { AlbumWithDetails } from '../types/album'
import { getErrorMessage } from '../utils/apiError'
import { formatTimestampDate } from '../utils/date'
import { ADMIN_ROLES, hasRole } from '../utils/roles'

interface ManageAlbumsPageProps {
  // "/admin/albums" for admins, "/team/albums" for team members.
  // The Create and Edit links stay inside the same area.
  basePath: string
}

// TEAM_MEMBER and ADMIN: list of all albums with Edit (and Delete for admins).
// The same page is used at /admin/albums and /team/albums, so the UI isn't duplicated.
function ManageAlbumsPage({ basePath }: ManageAlbumsPageProps) {
  const { profile } = useAuth()
  // Only admins get the Delete button. The backend refuses deletes from anyone else anyway.
  const canDelete = hasRole(profile?.role, ADMIN_ROLES)

  const [albums, setAlbums] = useState<AlbumWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // The album the admin clicked "Delete" on (shows the confirmation box)
  const [albumToDelete, setAlbumToDelete] = useState<AlbumWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Loads (or reloads) the list from the backend
  function loadAlbums() {
    return getAlbums()
      .then((list) => {
        setAlbums(list)
        setError('')
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAlbums()
  }, [])

  async function confirmDelete() {
    if (!albumToDelete) return
    setDeleting(true)
    setSuccess('')
    try {
      await deleteAlbum(albumToDelete.id)
      setAlbumToDelete(null)
      await loadAlbums() // refresh the list first, so the message never shows next to the deleted row
      setSuccess(`"${albumToDelete.name}" was deleted.`)
    } catch (err) {
      setError(getErrorMessage(err))
      setAlbumToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Manage Albums</h1>
        <Link
          to={`${basePath}/create`}
          className="rounded bg-orange-600 px-4 py-2 text-center font-semibold text-white hover:bg-orange-700"
        >
          Create Album
        </Link>
      </div>

      {success && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-green-700">{success}</p>}
      {error && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-red-700">{error}</p>}
      {loading && <p className="mt-6 text-gray-500">Loading albums...</p>}
      {!loading && !error && albums.length === 0 && (
        <p className="mt-6 text-gray-600">No albums yet. Click "Create Album" to add one.</p>
      )}

      {albums.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3">Album</th>
                <th className="px-4 py-3">Event</th>
                {/* Hidden on phones/tablets so the Actions column stays visible */}
                <th className="hidden px-4 py-3 md:table-cell">Created By</th>
                <th className="hidden px-4 py-3 lg:table-cell">Created At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/albums/${album.id}`} className="hover:text-orange-600">
                      {album.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{album.event?.title ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{album.creator?.full_name || '—'}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 lg:table-cell">{formatTimestampDate(album.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                      <Link to={`${basePath}/${album.id}/edit`} className="text-orange-600 hover:underline">
                        Edit
                      </Link>
                      {canDelete && (
                        <button type="button" onClick={() => setAlbumToDelete(album)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation box: nothing is deleted until the admin clicks Delete here */}
      {albumToDelete && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Delete album?</h2>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete "{albumToDelete.name}"? This cannot be undone.
            </p>
            <p className="mt-2 text-sm text-gray-500">All photos and videos in this album will be deleted too.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAlbumToDelete(null)}
                disabled={deleting}
                className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ManageAlbumsPage
