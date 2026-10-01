import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Last safety net: an unexpected error anywhere shows a friendly message, not a blank page */}
    <ErrorBoundary>
      {/* BrowserRouter lets the app change pages using the URL (/, /events, /login) */}
      <BrowserRouter>
        {/* AuthProvider makes the logged-in user available everywhere via useAuth() */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
