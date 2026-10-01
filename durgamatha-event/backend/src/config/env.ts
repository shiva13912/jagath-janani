import dotenv from 'dotenv'

// Reads the .env file (if there is one) and puts its values into process.env
dotenv.config({ quiet: true })

// Stops the server at startup with a clear message if a required setting is missing
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Add it to backend/.env (see .env.example).`)
  }
  return value
}

// NODE_ENV: anything other than "development" is treated as production, so forgetting to set it
// on the server never shows internal error details to visitors
const nodeEnv = process.env.NODE_ENV || 'production'
const isDevelopment = nodeEnv === 'development'

// The website's address, used by CORS. Locally it defaults to the Vite dev server; in production
// it must be set (e.g. https://durgamatha.vercel.app). A trailing "/" is removed, because the
// browser sends the origin without it and CORS would not match.
function frontendUrl(): string {
  const value = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '')
  if (value) return value
  if (isDevelopment) return 'http://localhost:5173'
  throw new Error('Missing environment variable FRONTEND_URL (the address of the website, e.g. https://your-site.vercel.app).')
}

// One typed object with all settings, so the rest of the code never reads process.env directly
export const env = {
  port: Number(process.env.PORT) || 5000, // the host (Render) sets PORT; 5000 is for local development
  nodeEnv,
  isDevelopment,
  frontendUrl: frontendUrl(),
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  // Cloudinary (photo/video storage). The API secret must only ever live in backend/.env.
  cloudinaryCloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: requireEnv('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: requireEnv('CLOUDINARY_API_SECRET'),
}
