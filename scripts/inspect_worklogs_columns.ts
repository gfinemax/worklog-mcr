
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.local
const envPath = path.resolve(__dirname, '../.env.local')
let envConfig = ''
try {
    envConfig = fs.readFileSync(envPath, 'utf8')
} catch (e) {
    console.error('Could not read .env.local', e)
    process.exit(1)
}

const env: { [key: string]: string } = {}

envConfig.split(/\r?\n/).forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return

    const delimiterIndex = line.indexOf('=')
    if (delimiterIndex === -1) return

    const key = line.substring(0, delimiterIndex).trim()
    let value = line.substring(delimiterIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
    }

    env[key] = value
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectColumns() {
    console.log('Inspecting worklogs columns...')

    // Fetch one row to see keys
    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Query failed:', JSON.stringify(error, null, 2))
    } else if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
    } else {
        console.log('No data found in worklogs table, cannot infer columns from row.')
    }
}

inspectColumns()
