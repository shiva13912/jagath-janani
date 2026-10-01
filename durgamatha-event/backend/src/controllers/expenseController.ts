import type { Request, Response } from 'express'
import * as eventService from '../services/eventService'
import * as expenseService from '../services/expenseService'
import { isValidUuid } from '../utils/eventValidation'
import { validateFinanceQuery, validateExpenseInput } from '../utils/financeValidation'
import { paginationOf } from '../utils/pagination'

// Who may call what is decided in the routes (requireAuth + requireRole):
// viewing = ADMIN and TEAM_MEMBER, creating/editing/deleting = ADMIN only.

function sendNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Expense not found' })
}

function sendEventNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Event not found' })
}

// Shared by GET /api/expenses and GET /api/events/:eventId/expenses
async function sendExpenseList(req: Request, res: Response, eventId: string | null) {
  const { data: query, errors } = validateFinanceQuery(req.query, true)
  if (!query) {
    res.status(400).json({ success: false, message: 'Invalid filter', errors })
    return
  }
  if (eventId) query.eventId = eventId // the event in the URL wins over ?eventId=

  const { records, total } = await expenseService.listExpenses(query)
  res.status(200).json({ success: true, expenses: records, pagination: paginationOf(query.page, query.limit, total) })
}

// GET /api/expenses?eventId=&category=&from=&to=&page=&limit=
export async function getAllExpenses(req: Request, res: Response) {
  await sendExpenseList(req, res, null)
}

// GET /api/events/:eventId/expenses
export async function getEventExpenses(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)
  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  await sendExpenseList(req, res, event.id)
}

// GET /api/expenses/:id
export async function getExpense(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const expense = await expenseService.getExpenseById(req.params.id)
  if (!expense) return sendNotFound(res)

  res.status(200).json({ success: true, expense })
}

// POST /api/events/:eventId/expenses — ADMIN only
export async function createExpense(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  const { data, errors } = validateExpenseInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid expense data', errors })
    return
  }

  const event = await eventService.getEventById(req.params.eventId)
  if (!event) return sendEventNotFound(res)

  // The creator is always the logged-in admin, whatever the body says
  const expense = await expenseService.createExpense(event.id, data, req.user!.id)
  res.status(201).json({ success: true, message: 'Expense added', expense })
}

// PUT /api/expenses/:id — ADMIN only
export async function updateExpense(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const { data, errors } = validateExpenseInput(req.body)
  if (!data) {
    res.status(400).json({ success: false, message: 'Invalid expense data', errors })
    return
  }

  const expense = await expenseService.updateExpense(req.params.id, data)
  if (!expense) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Expense updated', expense })
}

// DELETE /api/expenses/:id — ADMIN only
export async function deleteExpense(req: Request<{ id: string }>, res: Response) {
  if (!isValidUuid(req.params.id)) return sendNotFound(res)

  const deleted = await expenseService.deleteExpense(req.params.id)
  if (!deleted) return sendNotFound(res)

  res.status(200).json({ success: true, message: 'Expense deleted' })
}
