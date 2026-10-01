import type { Event, EventInput } from '../types/event'
import api from './api'

// All event API calls live here, so components never call Axios directly.
// The admin's token is added automatically by the interceptor in api.ts.

export async function getEvents(): Promise<Event[]> {
  const response = await api.get<{ success: boolean; events: Event[] }>('/events')
  return response.data.events
}

export async function getEventById(id: string): Promise<Event> {
  const response = await api.get<{ success: boolean; event: Event }>(`/events/${encodeURIComponent(id)}`)
  return response.data.event
}

export async function createEvent(data: EventInput): Promise<Event> {
  const response = await api.post<{ success: boolean; event: Event }>('/events', data)
  return response.data.event
}

export async function updateEvent(id: string, data: EventInput): Promise<Event> {
  const response = await api.put<{ success: boolean; event: Event }>(`/events/${encodeURIComponent(id)}`, data)
  return response.data.event
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${encodeURIComponent(id)}`)
}
