
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

async function checkContent() {
    const ids = ['01d7af35-2ec7-4a81-ae07-650e581fea93', '17ebcc70-6a1e-47e5-871a-6d825074d3d5']

    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('*')
        .in('id', ids)

    if (error) {
        console.error('Error:', error)
        return
    }

    logs.forEach(log => {
        console.log('--------------------------------------------------')
        console.log(`ID: ${log.id}`)
        console.log(`Group: ${log.group_name}`)
        console.log(`Created: ${log.created_at}`)
        // Handle snake_case vs camelCase depending on DB
        const channelLogs = log.channel_logs || log.channelLogs
        const systemIssues = log.system_issues || log.systemIssues

        console.log(`Channel Logs Keys:`, channelLogs ? Object.keys(channelLogs) : 'null')
        console.log(`System Issues Count:`, systemIssues ? systemIssues.length : 0)

        if (channelLogs) {
            Object.entries(channelLogs).forEach(([key, val]: [string, any]) => {
                if (val.posts && val.posts.length > 0) {
                    console.log(`  ${key} Posts: ${val.posts.length}`)
                }
                if (val.timecodes && Object.keys(val.timecodes).length > 0) {
                    console.log(`  ${key} Timecodes: ${Object.keys(val.timecodes).length}`)
                }
            })
        }
    })
}

checkContent()
