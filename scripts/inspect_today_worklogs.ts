
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectWorklogs() {
    const today = new Date().toISOString().split('T')[0]
    console.log(`Inspecting worklogs for today: ${today}`)

    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', today)

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    console.log(`Found ${data.length} worklogs.`)

    data.forEach((log, index) => {
        const channelLogs = log.channel_logs || {}
        const keys = Object.keys(channelLogs)
        let totalPosts = 0
        keys.forEach(k => {
            totalPosts += (channelLogs[k].posts?.length || 0)
        })
        console.log(`Log #${index + 1} | ID: ${log.id} | Type: ${log.type} | Group: ${log.group_name} | PostCount: ${totalPosts}`)
    })
}

inspectWorklogs()
