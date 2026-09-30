import type { HealthResponse } from '../types/api'
import api from './api'

// Asks the backend if it is running
export async function getHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health')
  return response.data
}
