
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectDuplicates() {
    console.log('Fetching worklogs for 2025-12-04...')
    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', '2025-12-04')
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    console.log('Found logs:', logs.length)
    logs.forEach(log => {
        console.log('--------------------------------------------------')
        console.log(`ID: ${log.id}`)
        console.log(`Type: ${log.type}`)
        console.log(`Team (col): ${log.team}`)
        console.log(`Group Name (col): ${log.group_name}`)
        console.log(`Group ID: ${log.group_id}`)
        console.log(`Created At: ${log.created_at}`)
        console.log(`Workers: ${JSON.stringify(log.workers)}`)
    })
}

inspectDuplicates()
