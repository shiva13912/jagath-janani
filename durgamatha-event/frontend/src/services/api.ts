import axios from 'axios'
import { supabase } from '../config/supabase'

// One shared Axios instance for the whole app.
// Every request made with `api` automatically goes to our backend, e.g.
// api.get('/health') -> http://localhost:5000/api/health
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // give up after 10 seconds instead of waiting forever
})

// Before every request: if the user is logged in, attach their Supabase access token
// as "Authorization: Bearer <token>" so the backend can check who they are.
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
