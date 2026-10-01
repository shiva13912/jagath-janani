import type { Pagination } from '../types/media'

// The pagination details sent next to every paginated list
export function paginationOf(page: number, limit: number, total: number): Pagination {
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
}
