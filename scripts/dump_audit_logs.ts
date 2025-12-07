
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

async function run() {
    console.log("Dumping Audit Logs...")
    const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    fs.writeFileSync('logs_dump.json', JSON.stringify(logs, null, 2))
    console.log("Saved to logs_dump.json")

    // Check triggers if possible (might fail with anon key, but service key should work)
    try {
        // This query is for Postgres. Supabase exposes it via SQL editor usually, 
        // via client we might not have access to information_schema directly depending on RLS.
        // We'll try a raw query if 'rpc' is available or just skip if we can't.
        // Actually, we can't run raw SQL easily without an RPC function.
        // We'll skip trigger check unless we have an RPC for it.
        console.log("Skipping direct trigger check (requires RPC/SQL access).")
    } catch (e) {
        console.error(e)
    }
}

run()
