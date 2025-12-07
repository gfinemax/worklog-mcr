
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
const env: any = {}
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function inspectWorkers() {
    const dates = ['2025-12-03', '2025-12-05']

    // We expect SWAP for:
    // Dec 3rd Day (2조)? - Let's check config again or just see what is there.
    // Dec 5th Day (4조)? 

    const { data: logs } = await supabase
        .from('worklogs')
        .select('date, type, group_name, workers')
        .in('date', dates)
        .order('date')

    if (!logs) return

    logs.forEach(l => {
        console.log(`--- ${l.date} ${l.type} [${l.group_name}] ---`)
        console.log(`Director: ${l.workers.director}`)
        console.log(`Assistant: ${l.workers.assistant}`)
        console.log(`Video: ${l.workers.video}`)
    })
}

inspectWorkers()
