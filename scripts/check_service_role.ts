
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (serviceRoleKey) {
    console.log('Service Role Key is PRESENT.')
} else {
    console.log('Service Role Key is MISSING.')
}
