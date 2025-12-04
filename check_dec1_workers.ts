
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
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
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function check() {
    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', '2025-12-01')
        .eq('type', '주간')
        .single()

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Current 12-01 Day Log:')
        console.log('Group:', data.group_name)
        console.log('Workers:', JSON.stringify(data.workers, null, 2))
    }
}

check()
