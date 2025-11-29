
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listTables() {
    console.log('Listing tables in public schema...')

    // We can't directly list tables via supabase-js easily without admin rights or rpc.
    // But we can try to select from a few potential tables to see if they exist.

    const tablesToCheck = ['worklogs', 'worklog_staff', 'work_sessions', 'work_session_members', 'users', 'groups']

    for (const table of tablesToCheck) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true })
        if (error) {
            console.log(`Table '${table}': Error - ${error.message}`)
        } else {
            console.log(`Table '${table}': Exists`)
        }
    }
}

listTables()
