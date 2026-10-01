import type { Request, Response } from 'express'
import * as eventService from '../services/eventService'
import * as incomeService from '../services/incomeService'
import { isValidUuid } from '../utils/eventValidation'
import { validateFinanceQuery, validateIncomeInput } from '../utils/financeValidation'
import { paginationOf } from '../utils/pagination'

// Who may call what is decided in the routes (requireAuth + requireRole):
// viewing = ADMIN and TEAM_MEMBER, creating/editing/deleting = ADMIN only.

function sendNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Income record not found' })
}

function sendEventNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Event not found' })
}

// Shared by GET /api/income and GET /api/events/:eventId/income
async function sendIncomeList(req: Request, res: Response, eventId: string | null) {
  const { data: query, errors } = validateFinanceQuery(req.query, false)
  if (!query) {
    res.status(400).json({ success: false, message: 'Invalid filter', errors })
    return
  }
  if (eventId) query.eventId = eventId // the event in the URL wins over ?eventId=

  const { records, total } = await incomeService.listIncome(query)
  res.status(200).json({ success: true, income: records, pagination: paginationOf(query.page, query.limit, total) })
}

// GET /api/income?eventId=&from=&to=&page=&limit=
export async function getAllIncome(req: Request, res: Response) {
  await sendIncomeList(req, res, null)
}

// GET /api/events/:eventId/income
export async function getEventIncome(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)
  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  await sendIncomeList(req, res, event.id)
}

// GET /api/income/:id
export async function getIncome(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const income = await incomeService.getIncomeById(req.params.id)
  if (!income) return sendNotFound(res)

  res.status(200).json({ success: true, income })
}

// POST /api/events/:eventId/income — ADMIN only
export async function createIncome(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  const { data, errors } = validateIncomeInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid income data', errors })
    return
  }

  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  // The creator is always the logged-in admin, whatever the body says
  const income = await incomeService.createIncome(event.id, data, req.user!.id)
  res.status(201).json({ success: true, message: 'Income added', income })
}

// PUT /api/income/:id — ADMIN only
export async function updateIncome(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const { data, errors } = validateIncomeInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid income data', errors })
    return
  }

  const income = await incomeService.updateIncome(req.params.id, data)
  if (!income) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Income updated', income })
}

// DELETE /api/income/:id — ADMIN only
export async function deleteIncome(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const deleted = await incomeService.deleteIncome(req.params.id)
  if (!deleted) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Income deleted' })
}
