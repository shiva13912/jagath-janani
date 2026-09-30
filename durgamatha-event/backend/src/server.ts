import app from './app'
import { env } from './config/env'

// Starts the HTTP server. Kept separate from app.ts so the app can be reused (for example in tests).
app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port} (${env.nodeEnv})`)
})
