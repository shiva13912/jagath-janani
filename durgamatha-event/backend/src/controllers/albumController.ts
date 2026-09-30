import type { Request, Response } from 'express'
import { CloudinaryError } from '../config/cloudinary'
import * as albumService from '../services/albumService'
import * as eventService from '../services/eventService'
import * as mediaService from '../services/mediaService'
import { validateAlbumInput } from '../utils/albumValidation'
import { sendCloudinaryDeleteFailed } from './mediaController'
import { isValidUuid } from '../utils/eventValidation'

// Same pattern as eventController: Express 5 sends errors thrown in async
// handlers to our error handler, so these functions don't need try/catch.

function sendAlbumNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Album not found' })
}

function sendEventNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Event not found' })
}

// GET /api/albums — anyone
export async function getAlbums(_req: Request, res: Response) {
  const albums = await albumService.getAllAlbums()
  res.status(200).json({ success: true, albums })
}

// GET /api/albums/:id — anyone. Includes the album's event and creator name.
export async function getAlbum(req: Request<{ id: string }>, res: Response) {
  // A badly formed id can't match any album, so answer 404 without asking the database
  if (!isValidUuid(req.params.id)) return sendAlbumNotFound(res)

  const album = await albumService.getAlbumById(req.params.id)
  if (!album) return sendAlbumNotFound(res)

  res.status(200).json({ success: true, album })
}

// GET /api/events/:eventId/albums — anyone
export async function getEventAlbums(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  // 404 for an unknown event, instead of an empty list that hides the mistake
  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  const albums = await albumService.getAlbumsByEvent(event.id)
  res.status(200).json({ success: true, albums })
}

// POST /api/events/:eventId/albums — TEAM_MEMBER and ADMIN (checked by the route middleware)
export async function createAlbum(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  const { data, errors } = validateAlbumInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid album data', errors })
    return
  }

  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  // The event comes from the URL, the creator from the logged-in user (requireAuth sets req.user)
  const album = await albumService.createAlbum(event.id, data, req.user!.id)
  res.status(201).json({ success: true, message: 'Album created', album })
}

// PUT /api/albums/:id — TEAM_MEMBER and ADMIN
export async function updateAlbum(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendAlbumNotFound(res)

  const { data, errors } = validateAlbumInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid album data', errors })
    return
  }

  const album = await albumService.updateAlbum(req.params.id, data)
  if (!album) return sendAlbumNotFound(res)

  res.status(200).json({ success: true, message: 'Album updated', album })
}

// DELETE /api/albums/:id — ADMIN only
export async function deleteAlbum(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendAlbumNotFound(res)

  // First delete the album's photos/videos from Cloudinary. The database then deletes
  // their rows together with the album (ON DELETE CASCADE). If Cloudinary fails, stop here.
  try {
    await mediaService.deleteFilesOfAlbums([req.params.id])
  } catch (err) {
    if (err instanceof CloudinaryError) return sendCloudinaryDeleteFailed(res, err)
    throw err
  }

  const deleted = await albumService.deleteAlbum(req.params.id)
  if (!deleted) return sendAlbumNotFound(res)

  res.status(200).json({ success: true, message: 'Album deleted' })
}
