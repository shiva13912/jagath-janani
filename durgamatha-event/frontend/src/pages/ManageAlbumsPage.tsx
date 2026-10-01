import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import Alert from '../components/ui/Alert'
import Button, { ButtonLink } from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageHeader from '../components/ui/PageHeader'
import ResponsiveTable, { SkeletonTable } from '../components/ui/ResponsiveTable'
import { EmptyState, ErrorState } from '../components/ui/StateMessages'
import { useApiData } from '../hooks/useApiData'
import { useAuth } from '../hooks/useAuth'
import { useFlashMessage } from '../hooks/useFlashMessage'
import { usePageTitle } from '../hooks/usePageTitle'
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
  usePageTitle('Manage Albums')
  const { profile } = useAuth()
  // Only admins get the Delete button. The backend refuses deletes from anyone else anyway.
  const canDelete = hasRole(profile?.role, ADMIN_ROLES)

  const { data: albums, error, loading, reload } = useApiData(useCallback(() => getAlbums(), []))
  const [success, setSuccess] = useFlashMessage() // e.g. "Album created successfully."
  const [actionError, setActionError] = useState('')
  // The album the admin clicked "Delete" on (shows the confirmation box)
  const [albumToDelete, setAlbumToDelete] = useState<AlbumWithDetails | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!albumToDelete) return
    setDeleting(true)
    setSuccess('')
    setActionError('')
    try {
      await deleteAlbum(albumToDelete.id)
      setSuccess(`Album deleted successfully. ("${albumToDelete.name}")`)
      reload()
    } catch (err) {
      setActionError(getErrorMessage(err))
    } finally {
      setDeleting(false)
      setAlbumToDelete(null)
    }
  }

  return (
    <section>
      <PageHeader
        title="Manage Albums"
        subtitle={canDelete ? 'Create, edit and delete albums.' : 'Create and edit albums.'}
        actions={<ButtonLink to={`${basePath}/create`}>+ Create Album</ButtonLink>}
      />

      {success && (
        <Alert tone="success" className="mb-4">
          {success}
        </Alert>
      )}
      {actionError && (
        <Alert tone="error" className="mb-4">
          {actionError}
        </Alert>
      )}

      {loading && <SkeletonTable label="Loading albums..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {albums && albums.length === 0 && (
        <EmptyState message="No albums yet.">
          <ButtonLink to={`${basePath}/create`}>Create Album</ButtonLink>
        </EmptyState>
      )}

      {albums && albums.length > 0 && (
        <ResponsiveTable
          caption="Albums"
          rows={albums}
          rowKey={(album) => album.id}
          columns={[
            {
              header: 'Album',
              cell: (album) => (
                <Link to={`/albums/${album.id}`} className="text-ink underline-offset-2 hover:text-primary hover:underline">
                  {album.name}
                </Link>
              ),
            },
            { header: 'Event', cell: (album) => album.event?.title ?? '—' },
            { header: 'Created By', cell: (album) => album.creator?.full_name || '—', hideBelow: 'lg' },
            { header: 'Created At', cell: (album) => <span className="whitespace-nowrap">{formatTimestampDate(album.created_at)}</span>, hideBelow: 'lg' },
          ]}
          actions={(album) => (
            <>
              <ButtonLink to={`${basePath}/${album.id}/edit`} variant="secondary" size="sm" aria-label={`Edit ${album.name}`}>
                Edit
              </ButtonLink>
              {canDelete && (
                <Button variant="danger" size="sm" onClick={() => setAlbumToDelete(album)} aria-label={`Delete ${album.name}`}>
                  Delete
                </Button>
              )}
            </>
          )}
        />
      )}

      {/* Confirmation box: nothing is deleted until the admin clicks Delete here */}
      {albumToDelete && (
        <ConfirmDialog
          title="Delete album?"
          confirmLabel="Delete"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setAlbumToDelete(null)}
        >
          <p>Are you sure you want to delete "{albumToDelete.name}"? This cannot be undone.</p>
          <p className="text-sm">All photos and videos in this album will be deleted too.</p>
        </ConfirmDialog>
      )}
    </section>
  )
}

export default ManageAlbumsPage
