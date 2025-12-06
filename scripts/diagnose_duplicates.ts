
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

async function diagnose() {
    const date = '2025-12-06'
    console.log(`Fetching worklogs for ${date}...`)

    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    console.log(`Found ${logs.length} logs for ${date}`)

    logs.forEach(log => {
        console.log('--------------------------------------------------')
        console.log(`ID: ${log.id}`)
        console.log(`Type: ${log.type}`)
        console.log(`Group ID: ${log.group_id}`)
        console.log(`Created At: ${log.created_at}`)
        console.log(`Status: ${log.status}`)
        // console.log(`Workers:`, log.workers)
    })
}

diagnose()
