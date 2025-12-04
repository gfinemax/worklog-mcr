
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectWorklog() {
    console.log('Inspecting worklog for 2025-12-03...')

    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', '2025-12-03')

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    if (!worklogs || worklogs.length === 0) {
        console.log('No worklogs found for this date')
        return
    }

    worklogs.forEach(log => {
        console.log('--------------------------------')
        console.log(`ID: ${log.id}`)
        console.log(`Date: ${log.date}`)
        console.log(`Team: ${log.group_name}`) // Note: DB column might be group_name or team
        console.log(`Type: ${log.type}`)
        console.log(`Workers:`, JSON.stringify(log.workers, null, 2))
    })
}

inspectWorklog()
