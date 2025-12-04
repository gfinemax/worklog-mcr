
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Simple .env parser
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteWorklog() {
    const today = '2025-12-04'
    const groupName = '2조'
    const type = '주간'

    console.log(`Deleting worklog for ${today} ${groupName} ${type}...`)

    const { error } = await supabase
        .from('worklogs')
        .delete()
        .eq('date', today)
        .eq('group_name', groupName)
        .eq('type', type)

    if (error) {
        console.error('Error deleting:', error)
    } else {
        console.log('Successfully deleted incorrect worklog.')
    }
}

deleteWorklog()
