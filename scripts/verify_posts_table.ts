
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyTable() {
    console.log('Verifying posts table...')
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error accessing posts table:', error)
    } else {
        console.log('Successfully accessed posts table. Row count:', data.length)
    }

    console.log('Verifying categories table...')
    const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .limit(1)

    if (catError) {
        console.error('Error accessing categories table:', catError)
    } else {
        console.log('Successfully accessed categories table. Row count:', catData.length)
    }
    if (catError) {
        console.error('Error accessing categories table:', catError)
    } else {
        console.log('Successfully accessed categories table. Row count:', catData.length)
    }

    console.log('Verifying users table...')
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .limit(1)

    if (userError) {
        console.error('Error accessing users table:', userError)
    } else {
        console.log('Successfully accessed users table. Row count:', userData.length)
        if (userData.length > 0) {
            console.log('Valid User ID:', userData[0].id)
        } else {
            console.log('No users found in public.users table.')
        }
    }
}

verifyTable()
