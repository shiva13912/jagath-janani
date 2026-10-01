import type { Request, Response } from 'express'
import * as dashboardService from '../services/dashboardService'
import { isValidUuid } from '../utils/eventValidation'

function sendEventNotFound(res: Response) {
  res.status(404).json({ success: false, message: 'Event not found' })
}

// GET /api/dashboard/summary — ADMIN and TEAM_MEMBER
// Site-wide totals: events, albums, photos, videos, income, expenses and the balance
export async function getDashboardSummary(_req: Request, res: Response) {
  const summary = await dashboardService.getDashboardSummary()
  res.status(200).json({ success: true, summary })
}

// GET /api/events/:eventId/dashboard-summary — ADMIN and TEAM_MEMBER
// The same numbers for one event, plus its expenses by category
export async function getEventDashboardSummary(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  const summary = await dashboardService.getEventSummary(req.params.eventId)
  if (!summary) return sendEventNotFound(res)

  res.status(200).json({ success: true, summary })
}

// GET /api/events/:eventId/financial-summary — ADMIN and TEAM_MEMBER
// Only the money: { totalIncome, totalExpenses, remainingBalance }
export async function getEventFinancialSummary(req: Request<{ eventId: string }>, res: Response) {
  if (!isValidUuid(req.params.eventId)) return sendEventNotFound(res)

  const summary = await dashboardService.getEventSummary(req.params.eventId)
  if (!summary) return sendEventNotFound(res)

  const { totalIncome, totalExpenses, remainingBalance } = summary
  res.status(200).json({ success: true, summary: { totalIncome, totalExpenses, remainingBalance } })
}
