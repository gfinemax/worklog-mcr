
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

async function checkRange() {
    const startDate = '2025-12-01'
    const endDate = '2025-12-05'

    console.log(`Checking worklogs from ${startDate} to ${endDate}...`)

    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('date, type, group_name, status')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')

    if (error) {
        console.error(error)
        return
    }

    console.log(`Found ${logs.length} logs.`)
    logs.forEach(l => console.log(`${l.date} [${l.type}] - ${l.group_name} (${l.status})`))
}

checkRange()
