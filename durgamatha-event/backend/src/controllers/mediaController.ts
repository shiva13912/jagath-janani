import type { NextFunction, Request, Response } from 'express'
import fs from 'node:fs/promises'
import { CloudinaryError } from '../config/cloudinary'
import * as albumService from '../services/albumService'
import * as mediaService from '../services/mediaService'
import type { Media, MediaUploadError, Pagination } from '../types/media'
import { isValidUuid } from '../utils/eventValidation'
import { validateMediaQuery } from '../utils/galleryValidation'
import { FileRejectedError, getFileKind, validateMediaFile } from '../utils/mediaValidation'

// Same pattern as the other controllers: errors thrown here go to the error handler.

function sendMediaNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Media not found' })
}

// Used by every delete that has to remove Cloudinary files first (media, album, event).
// Nothing was deleted from the database, so the admin can simply try again.
export function sendCloudinaryDeleteFailed(res: Response, err: CloudinaryError) {
  console.error(err)
  res.status(502).json({ success: false, message: 'Could not delete the files from Cloudinary. Nothing was deleted, please try again.' })
}

function sendAlbumNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Album not found' })
}

// Middleware for POST /api/albums/:albumId/media. Runs BEFORE the files are received,
// so nothing is uploaded for an album that doesn't exist. Keeps the album for the next step.
export async function requireAlbum(req: Request<{ albumId: string }>, res: Response, next: NextFunction) {
  if (!isValidUuid(req.params.albumId)) return sendAlbumNotFound(res)

  const album = await albumService.getAlbumById(req.params.albumId)
  if (!album) return sendAlbumNotFound(res)

  res.locals.album = album
  next()
}

// Builds the "pagination" part of a list response
function paginationOf(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}

function sendInvalidQuery(res: Response, errors: string[]) {
  res.status(400).json({ success: false, message: 'Invalid filter', errors })
}

// GET /api/albums/:albumId/media?page=1&limit=24&type=image — anyone.
// One page of the album's photos/videos, newest first.
export async function getAlbumMedia(req: Request<{ albumId: string }>, res: Response) {
  if (!isValidUuid(req.params.albumId)) return sendAlbumNotFound(res)

  const { data: query, errors } = validateMediaQuery(req.query)
  if (!query) return sendInvalidQuery(res, errors)

  const album = await albumService.getAlbumById(req.params.albumId)
  if (!album) return sendAlbumNotFound(res)

  const { media, total } = await mediaService.listMedia({
    albumIds: [album.id],
    type: query.type,
    page: query.page,
    limit: query.limit,
  })
  res.status(200).json({ success: true, media, pagination: paginationOf(query.page, query.limit, total) })
}

// GET /api/media?eventId=...&albumId=...&type=video&page=1&limit=24 — anyone.
// The public gallery: photos/videos from all albums, newest first, with optional filters.
export async function getGalleryMedia(req: Request, res: Response) {
  const { data: query, errors } = validateMediaQuery(req.query)
  if (!query) return sendInvalidQuery(res, errors)

  // Which albums to look in: null means all of them
  let albumIds: string[] | null = null
  if (query.eventId) {
    albumIds = await albumService.getAlbumIdsByEvent(query.eventId)
    // Album AND event chosen: the album only counts if it belongs to that event
    if (query.albumId) albumIds = albumIds.includes(query.albumId) ? [query.albumId] : []
  } else if (query.albumId) {
    albumIds = [query.albumId]
  }

  const { media, total } = await mediaService.listMedia({
    albumIds: albumIds,
    type: query.type,
    page: query.page,
    limit: query.limit,
  })
  res.status(200).json({ success: true, media, pagination: paginationOf(query.page, query.limit, total) })
}

// GET /api/media/:id — anyone
export async function getMedia(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendMediaNotFound(res)

  const media = await mediaService.getMediaById(req.params.id)
  if (!media) return sendMediaNotFound(res)

  res.status(200).json({ success: true, media })
}

// POST /api/albums/:albumId/media — TEAM_MEMBER and ADMIN.
// requireAlbum and uploadMediaFiles have already run. Each file is handled on its own:
// one bad file does not stop the others, and every file gets a result.
export async function uploadMedia(req: Request<{ albumId: string }>, res: Response) {
  const files = Array.isArray(req.files) ? req.files : []
  const album = res.locals.album as { id: string; event_id: string }

  if (files.length === 0) {
    res.status(400).json({ success: false, message: 'Please choose at least one photo or video.' })
    return
  }

  const uploaded: Media[] = []
  const errors: MediaUploadError[] = []

  try {
    // One file at a time, so the server never sends many large files to Cloudinary at once
    for (const file of files) {
      const problem = validateMediaFile(file.originalname, file.mimetype, file.size)
      if (problem) {
        errors.push({ filename: file.originalname, message: problem })
        continue
      }

      try {
        const media = await mediaService.uploadMedia({
          filePath: file.path,
          originalFilename: file.originalname,
          kind: getFileKind(file.originalname, file.mimetype) ?? 'image',
          albumId: album.id,
          eventId: album.event_id,
          uploadedBy: req.user!.id, // never taken from the request body
        })
        uploaded.push(media)
      } catch (err) {
        if (err instanceof FileRejectedError) {
          errors.push({ filename: file.originalname, message: err.message })
        } else {
          console.error(`Upload of ${file.originalname} failed:`, err)
          const message =
            err instanceof CloudinaryError
              ? 'Could not upload to Cloudinary. Please try again.'
              : 'Could not save the file. Please try again.'
          errors.push({ filename: file.originalname, message })
        }
      }
    }
  } finally {
    // Always delete the temporary files: nothing is kept on the server
    await Promise.all(files.map((file) => fs.rm(file.path, { force: true })))
  }

  if (uploaded.length === 0) {
    res.status(400).json({ success: false, message: errors.map((e) => `${e.filename}: ${e.message}`).join(' '), errors })
    return
  }

  res.status(201).json({
    success: true,
    message: `${uploaded.length} file(s) uploaded`,
    media: uploaded,
    errors, // files that failed, if any
  })
}

// DELETE /api/media/:id — ADMIN only
export async function deleteMedia(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendMediaNotFound(res)

  const media = await mediaService.getMediaById(req.params.id)
  if (!media) return sendMediaNotFound(res)

  try {
    await mediaService.deleteMedia(media)
  } catch (err) {
    if (err instanceof CloudinaryError) return sendCloudinaryDeleteFailed(res, err)
    throw err
  }

  res.status(200).json({ success: true, message: 'Media deleted' })
}
