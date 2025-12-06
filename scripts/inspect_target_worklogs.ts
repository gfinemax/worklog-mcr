import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectWorklogs() {
    const targetDate = '2025-12-05'
    console.log(`Inspecting worklogs for: ${targetDate}`)

    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', targetDate)

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    console.log(`Found ${data.length} worklogs.`)
    const fs = require('fs')
    fs.writeFileSync('temp_worklogs_dump.json', JSON.stringify(data, null, 2))
    console.log('Worklogs dumped to temp_worklogs_dump.json')
}

inspectWorklogs()
