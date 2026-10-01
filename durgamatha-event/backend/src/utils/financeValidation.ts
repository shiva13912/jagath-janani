import {
  EXPENSE_CATEGORIES,
  type CreateExpenseRequest,
  type CreateIncomeRequest,
  type ExpenseCategory,
  type FinanceQuery,
} from '../types/finance'
import { isValidDate, isValidUuid } from './eventValidation'

export const TITLE_MAX_LENGTH = 150
export const SOURCE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 2000
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

type Result<T> = { data: T; errors: [] } | { data: null; errors: string[] }

// ---------------------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------------------

// Checks an amount and returns it as exact text with 2 decimals, e.g. 1500 -> "1500.00".
// Accepts a number (1500, 99.5) or text ("1500", "1500.50"). Rejects 0, negatives,
// more than 2 decimal places, "abc", "1e5", "" and amounts above 9,999,999,999.99
// (the largest value numeric(12,2) can store). Returns null when invalid.
export function parseAmount(value: unknown): string | null {
  let text: string
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    text = String(value)
  } else if (typeof value === 'string') {
    text = value.trim()
  } else {
    return null
  }

  // Up to 10 digits, then optionally a dot and 1-2 digits. No signs, spaces, commas or "e".
  const match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(text)
  if (!match) return null

  const whole = match[1].replace(/^0+(?=\d)/, '') // "0100" -> "100"
  const cents = (match[2] ?? '').padEnd(2, '0') // "5" -> "50"
  if (/^0+$/.test(whole) && cents === '00') return null // zero is not allowed
  return `${whole}.${cents}`
}

// ---------------------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------------------

function readText(body: Record<string, unknown>, field: string): string {
  const value = body[field]
  return typeof value === 'string' ? value.trim() : ''
}

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

// The fields both income and expenses have. Only these are read from the body, so
// id, event_id, created_by, created_at, "remaining balance", ... can never be set by a client.
function readCommon(input: Record<string, unknown>, dateField: string, dateLabel: string, errors: string[]) {
  const title = readText(input, 'title')
  if (!title) errors.push('Title is required.')
  else if (title.length > TITLE_MAX_LENGTH) errors.push(`Title must be at most ${TITLE_MAX_LENGTH} characters.`)

  const descriptionText = readText(input, 'description')
  if (input.description !== undefined && input.description !== null && typeof input.description !== 'string') {
    errors.push('Description must be text.')
  } else if (descriptionText.length > DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.`)
  }

  const amount = parseAmount(input.amount)
  if (input.amount === undefined || input.amount === null || input.amount === '') errors.push('Amount is required.')
  else if (amount === null) errors.push('Amount must be a number greater than 0 with at most 2 decimal places (for example 1500 or 1500.50).')

  const date = readText(input, dateField)
  if (!date) errors.push(`${dateLabel} is required.`)
  else if (!isValidDate(date)) errors.push(`${dateLabel} must be a valid date in YYYY-MM-DD format.`)

  return { title, description: descriptionText || null, amount: amount ?? '', date }
}

// Body of POST /api/events/:eventId/income and PUT /api/income/:id
export function validateIncomeInput(body: unknown): Result<CreateIncomeRequest> {
  const input = toObject(body)
  const errors: string[] = []
  const common = readCommon(input, 'received_date', 'Received date', errors)

  const source = readText(input, 'source')
  if (!source) errors.push('Source is required.')
  else if (source.length > SOURCE_MAX_LENGTH) errors.push(`Source must be at most ${SOURCE_MAX_LENGTH} characters.`)

  if (errors.length > 0) return { data: null, errors }
  return {
    data: { title: common.title, description: common.description, amount: common.amount, source, received_date: common.date },
    errors: [],
  }
}

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === 'string' && (EXPENSE_CATEGORIES as readonly string[]).includes(value)
}

// Body of POST /api/events/:eventId/expenses and PUT /api/expenses/:id
export function validateExpenseInput(body: unknown): Result<CreateExpenseRequest> {
  const input = toObject(body)
  const errors: string[] = []
  const common = readCommon(input, 'spent_date', 'Date', errors)

  const category = input.category
  if (category === undefined || category === '') errors.push('Category is required.')
  else if (!isExpenseCategory(category)) errors.push(`Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`)

  if (errors.length > 0 || !isExpenseCategory(category)) return { data: null, errors }
  return {
    data: { title: common.title, description: common.description, amount: common.amount, category, spent_date: common.date },
    errors: [],
  }
}

// ---------------------------------------------------------------------------------------
// List filters: ?eventId=&category=&from=&to=&page=&limit=
// ---------------------------------------------------------------------------------------

// Express gives each query value as a string, a list (?page=1&page=2) or undefined
function readParam(query: Record<string, unknown>, name: string): string | undefined | null {
  const value = query[name]
  if (value === undefined || value === '') return undefined
  return typeof value === 'string' ? value : null
}

function readPositiveInteger(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null
  const number = Number(value)
  return number >= 1 && Number.isSafeInteger(number) ? number : null
}

export function validateFinanceQuery(query: Record<string, unknown>, allowCategory: boolean): Result<FinanceQuery> {
  const errors: string[] = []

  let page = 1
  const rawPage = readParam(query, 'page')
  if (rawPage !== undefined) {
    const value = readPositiveInteger(rawPage)
    if (value === null) errors.push('page must be a whole number of at least 1.')
    else page = value
  }

  let limit = DEFAULT_PAGE_SIZE
  const rawLimit = readParam(query, 'limit')
  if (rawLimit !== undefined) {
    const value = readPositiveInteger(rawLimit)
    if (value === null || value > MAX_PAGE_SIZE) errors.push(`limit must be a whole number from 1 to ${MAX_PAGE_SIZE}.`)
    else limit = value
  }

  let eventId: string | null = null
  const rawEventId = readParam(query, 'eventId')
  if (rawEventId !== undefined) {
    if (rawEventId === null || !isValidUuid(rawEventId)) errors.push('eventId is not valid.')
    else eventId = rawEventId
  }

  let category: ExpenseCategory | null = null
  const rawCategory = readParam(query, 'category')
  if (rawCategory !== undefined) {
    if (!allowCategory) errors.push('category can only be used for expenses.')
    else if (!isExpenseCategory(rawCategory)) errors.push(`category must be one of: ${EXPENSE_CATEGORIES.join(', ')}.`)
    else category = rawCategory
  }

  const dates: Record<'from' | 'to', string | null> = { from: null, to: null }
  for (const name of ['from', 'to'] as const) {
    const raw = readParam(query, name)
    if (raw === undefined) continue
    if (raw === null || !isValidDate(raw)) errors.push(`${name} must be a valid date in YYYY-MM-DD format.`)
    else dates[name] = raw
  }
  if (dates.from && dates.to && dates.from > dates.to) errors.push('from must be on or before to.')

  if (errors.length > 0) return { data: null, errors }
  return { data: { page, limit, eventId, category, from: dates.from, to: dates.to }, errors: [] }
}
