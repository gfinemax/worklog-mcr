
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const logFile = 'fk_test_results.txt'
fs.writeFileSync(logFile, 'Starting FK Hint Test\n')

function log(msg: string) {
    fs.appendFileSync(logFile, msg + '\n')
    console.log(msg)
}

async function testHint(hint: string) {
    log(`Testing hint: ${hint}`)
    const { data, error } = await supabase
        .from('posts')
        .select(`
      id,
      creator:users!${hint}(name)
    `)
        .limit(1)

    if (error) {
        log(`Failed with hint '${hint}': ${error.message}`)
    } else {
        log(`SUCCESS with hint '${hint}'!`)
    }
}

async function run() {
    // Try column name
    await testHint('created_by')
    // Try standard name
    await testHint('posts_created_by_fkey')
    // Try variations
    await testHint('posts_created_by_fkey1')
    await testHint('posts_users_created_by_fkey')
    await testHint('posts_created_by_user_id_fkey')
}

run()
