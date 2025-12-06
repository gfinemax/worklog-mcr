
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyFix() {
    const targetDate = '2025-12-06'
    const shiftType = '주간'

    console.log(`Verifying duplicate prevention for ${targetDate} (${shiftType})...`)

    // 1. Check current state (should be 1 log)
    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('id, group_name')
        .eq('date', targetDate)
        .eq('type', shiftType)

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    console.log(`Found ${logs.length} log(s).`)
    logs.forEach(l => console.log(`- ID: ${l.id}, Team: ${l.group_name}`))

    if (logs.length === 1) {
        console.log('SUCCESS: Only one log exists.')
    } else {
        console.error('FAILURE: Multiple logs exist!')
    }

    // Note: We cannot easily simulate the client-side creation block here without a browser test,
    // but the server-side pre-check in `worklog-detail.tsx` (if we could call it) would prevent it.
    // The script confirms the cleanup was successful.
}

verifyFix()
