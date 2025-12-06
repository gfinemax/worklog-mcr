
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPastWorklogs() {
    console.log('Checking worklogs for 1조 on Swap days (Nov 17, Nov 27)...')

    const dates = ['2025-11-17', '2025-11-27']

    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .in('date', dates)
        .eq('group_name', '1조')

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    if (data.length === 0) {
        console.log('No worklogs found for these dates.')
    } else {
        data.forEach((log: any) => {
            console.log(`\nDate: ${log.date}, Type: ${log.type}`)
            console.log('Workers:', JSON.stringify(log.workers, null, 2))
        })
    }
}

checkPastWorklogs()
