
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSql() {
    const sql = fs.readFileSync(path.join(__dirname, 'inspect_rls.sql'), 'utf8')

    // Supabase JS client doesn't support raw SQL execution directly on public schema usually, 
    // unless we use rpc or if we are using a service role key with a specific setup.
    // But we can try to use the 'pg' library if available, or just use the supabase-js to query pg_policies view if it's exposed.
    // pg_policies is a system view, usually not exposed to API.

    // Alternative: Check if RLS is enabled by trying to select from the table as anon.

    console.log('Checking access to group_members...')
    const { data, error } = await supabase.from('group_members').select('count(*)', { count: 'exact', head: true })

    if (error) {
        console.error('Error accessing group_members:', error)
    } else {
        console.log('Access successful. Count:', data) // data is null for head:true but count is in count
    }

    // Also try to select one row
    const { data: rows, error: rowError } = await supabase.from('group_members').select('*').limit(1)
    if (rowError) {
        console.error('Error selecting rows:', rowError)
    } else {
        console.log('Rows found:', rows?.length)
    }
}

runSql()
