
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserPins() {
    console.log('Checking user PIN codes...')

    const { data: users, error } = await supabase
        .from('users')
        .select('name, email, pin_code, role')
        .order('name')

    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    console.log('\nUser PIN Codes:')
    console.log(JSON.stringify(users, null, 2))
}

checkUserPins()
