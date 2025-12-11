// Script to run the channel_logs protection migration
// Usage: npx tsx scripts/run_channel_logs_protection.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

async function runMigration() {
    console.log('🔒 Running Channel Logs Protection Migration...\n')

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_channel_logs_protection.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    // Split by statements (simple approach)
    const statements = sql
        .split(/;[\r\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} statements to execute.\n`)

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]

        // Skip empty or comment-only statements
        if (!statement || statement.startsWith('--')) continue

        // Extract first line for logging
        const firstLine = statement.split('\n')[0].substring(0, 60)
        console.log(`[${i + 1}/${statements.length}] ${firstLine}...`)

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' })

            if (error) {
                // Try direct execution for DDL statements
                console.log(`   ⚠️ RPC failed, this may need manual execution in Supabase Dashboard`)
                console.log(`   Error: ${error.message}`)
            } else {
                console.log(`   ✅ Success`)
            }
        } catch (err: any) {
            console.log(`   ⚠️ ${err.message}`)
        }
    }

    console.log('\n✅ Migration script completed!')
    console.log('\n📋 Next Steps:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Copy the contents of scripts/create_channel_logs_protection.sql')
    console.log('3. Run the SQL manually to ensure all statements execute correctly')
}

runMigration().catch(console.error)
