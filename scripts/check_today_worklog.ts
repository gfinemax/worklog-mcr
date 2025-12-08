import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkTodayWorklog() {
    const { data, error } = await supabase
        .from('worklogs')
        .select('id, date, group_name, type, workers, channel_logs')
        .eq('date', '2025-12-08')
        .eq('group_name', '2조')
        .eq('type', '주간')
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('=== Worklog Data ===')
    console.log('ID:', data.id)
    console.log('Date:', data.date)
    console.log('Group:', data.group_name)
    console.log('Type:', data.type)
    console.log('\n=== Workers ===')
    console.log(JSON.stringify(data.workers, null, 2))
    console.log('\n=== Channel Logs ===')
    console.log(JSON.stringify(data.channel_logs, null, 2))
}

checkTodayWorklog()
