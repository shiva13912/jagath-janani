import axios from 'axios'
import { supabase } from '../config/supabase'

// One shared Axios instance for the whole app.
// Every request made with `api` automatically goes to our backend, e.g.
// api.get('/health') -> http://localhost:5000/api/health
// The backend's address, e.g. http://localhost:5000 locally or https://your-api.onrender.com
// in production. A trailing "/" is removed so URLs never contain "//api".
const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
if (!apiUrl) {
  throw new Error('Missing VITE_API_URL. Add it to frontend/.env (see .env.example).')
}

const api = axios.create({
  baseURL: `${apiUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // Give up after 60 seconds instead of waiting forever. A free Render server "sleeps" when
  // unused and needs up to about a minute to wake up for the first request.
  timeout: 60000,
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
