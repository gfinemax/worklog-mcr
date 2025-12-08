import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(__dirname, '../.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL!, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function check() {
    const { data, error } = await supabase
        .from('worklogs')
        .select('id, date, group_name, type, channel_logs')
        .eq('date', '2025-12-08')
        .order('created_at', { ascending: false })

    if (error) { console.error('Error:', error); return }
    console.log('2025-12-08 Worklogs:')
    data.forEach(log => {
        console.log('ID:', log.id, 'Team:', log.group_name, 'Type:', log.type)
        console.log('Channel Logs:', JSON.stringify(log.channel_logs, null, 2))
        console.log('---')
    })
}
check()
