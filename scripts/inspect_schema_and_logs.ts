
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Simple .env parser similar to existing scripts
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
const env: any = {}
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspect() {
    console.log("--- WORKLOGS SCHEMA (via Row Inspection) ---")
    const { data: worklog } = await supabase.from('worklogs').select('*').limit(1)
    if (worklog && worklog.length > 0) {
        console.log(Object.keys(worklog[0]))
    } else {
        console.log("No worklogs found to inspect schema.")
    }

    console.log("\n--- RECENT AUDIT LOGS ---")
    const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    console.log(JSON.stringify(auditLogs, null, 2))
}

inspect()
