
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Function to manually parse .env.local
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) return {}
    const content = fs.readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1)
            }
            env[match[1].trim()] = value
        }
    })
    return env
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugTimecodes() {
    console.log("Searching for Worklog: 2025-12-11 (Night/야간)...")

    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', '2025-12-11')
        .eq('type', '야간')

    if (error) {
        console.error("Error fetching logs:", JSON.stringify(error, null, 2))
        return
    }

    if (!logs || logs.length === 0) {
        console.log("No 2025-12-11 Night log found.")
    } else {
        console.log(`Found ${logs.length} log(s).`)
        logs.forEach(log => {
            console.log("===================================================")
            console.log(`ID: ${log.id}`)
            console.log(`Date: ${log.date}, Type: ${log.type}`)
            console.log(`Status: ${log.status}`)
            console.log("---------------------------------------------------")
            const cLogs = log.channel_logs as any
            if (cLogs) {
                Object.keys(cLogs).forEach(ch => {
                    const chData = cLogs[ch]
                    console.log(`Channel [${ch}]:`)
                    console.log(`  Posts: ${chData?.posts?.length || 0}`)
                    console.log(`  Timecodes: ${JSON.stringify(chData?.timecodes)}`)
                })
            } else {
                console.log("channel_logs is NULL or empty")
            }
            console.log("===================================================")
        })
    }
}

debugTimecodes()
