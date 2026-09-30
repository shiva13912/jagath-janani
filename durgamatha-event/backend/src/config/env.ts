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

// One typed object with all settings, so the rest of the code never reads process.env directly
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  // Cloudinary (photo/video storage). The API secret must only ever live in backend/.env.
  cloudinaryCloudName: requireEnv('CLOUDINARY_CLOUD_NAME'),
  cloudinaryApiKey: requireEnv('CLOUDINARY_API_KEY'),
  cloudinaryApiSecret: requireEnv('CLOUDINARY_API_SECRET'),
}
