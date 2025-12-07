
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

async function checkSignatures() {
    const dates = ['2025-12-05', '2025-12-06', '2025-12-07']

    const { data: logs } = await supabase
        .from('worklogs')
        .select('date, type, group_name, status, signature, signatures')
        .in('date', dates)
        .order('date', { ascending: false })

    if (logs) {
        logs.forEach(l => {
            console.log(`\n[${l.date} ${l.group_name} ${l.type}] Status: ${l.status}`)
            console.log(`  - signature (legacy): ${l.signature}`)
            console.log(`  - signatures (json):`)
            console.log(JSON.stringify(l.signatures, null, 2))
        })
    }
}

checkSignatures()
