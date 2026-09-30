import type { Request, Response } from 'express'
import { CloudinaryError } from '../config/cloudinary'
import * as albumService from '../services/albumService'
import * as eventService from '../services/eventService'
import * as mediaService from '../services/mediaService'
import { isValidUuid, validateEventInput } from '../utils/eventValidation'
import { sendCloudinaryDeleteFailed } from './mediaController'

// Express 5 automatically sends errors thrown in async handlers to our error handler,
// so these functions don't need try/catch.

function sendNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Event not found' })
}

// GET /api/events — anyone
export async function getEvents(_req: Request, res: Response) {
  const events = await eventService.getAllEvents()
  res.status(200).json({ success: true, events })
}

// GET /api/events/:id — anyone
export async function getEvent(req: Request<{ id: string }>, res: Response) {
  // A badly formed id can't match any event, so answer 404 without asking the database
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const event = await eventService.getEventById(req.params.id)
  if (!event) return sendNotFound(res)

  res.status(200).json({ success: true, event })
}

// POST /api/events — ADMIN only (checked by the route middleware)
export async function createEvent(req: Request, res: Response) {
  const { data, errors } = validateEventInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid event data', errors })
    return
  }

  // requireAuth guarantees req.user exists; the creator is the logged-in admin
  const event = await eventService.createEvent(data, req.user!.id)
  res.status(201).json({ success: true, message: 'Event created', event })
}

// PUT /api/events/:id — ADMIN only
export async function updateEvent(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const { data, errors } = validateEventInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid event data', errors })
    return
  }

  const event = await eventService.updateEvent(req.params.id, data)
  if (!event) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Event updated', event })
}

// DELETE /api/events/:id — ADMIN only
export async function deleteEvent(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  // First delete the photos/videos of ALL the event's albums from Cloudinary.
  // The database then deletes the albums and media rows with the event (ON DELETE CASCADE).
  // If Cloudinary fails, stop here so nothing is left half-deleted.
  try {
    const albums = await albumService.getAlbumsByEvent(req.params.id)
    await mediaService.deleteFilesOfAlbums(albums.map((album) => album.id))
  } catch (err) {
    if (err instanceof CloudinaryError) return sendCloudinaryDeleteFailed(res, err)
    throw err
  }

  const deleted = await eventService.deleteEvent(req.params.id)
  if (!deleted) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Event deleted' })
}
