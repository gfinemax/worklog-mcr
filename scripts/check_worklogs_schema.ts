
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking worklogs table schema...')

    // Check columns
    const { data: columns, error: columnsError } = await supabase
        .rpc('get_columns', { table_name: 'worklogs' }) // Try RPC first if exists, otherwise fallback to direct query if possible (Supabase JS doesn't support direct SQL easily without RPC)

    // Fallback: Query a single row to see keys
    const { data: rows, error: rowsError } = await supabase
        .from('worklogs')
        .select('*')
        .limit(1)

    if (rowsError) {
        console.error('Error fetching rows:', rowsError)
    } else if (rows && rows.length > 0) {
        console.log('Worklogs columns based on row:', Object.keys(rows[0]))
    } else {
        console.log('Worklogs table is empty, cannot infer columns from data.')
    }

    // Attempt to insert a dummy record to force a constraint error if we want to check constraints, 
    // but we already know the constraint is missing.
}

checkSchema()
