
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectWorklogs() {
    const targetDate = '2025-11-29'
    console.log(`Fetching worklogs for ${targetDate}...`)

    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select(`
      id, 
      date, 
      type, 
      group_id, 
      created_at,
      groups ( name )
    `)
        .eq('date', targetDate)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    let output = `Found ${worklogs.length} worklogs for ${targetDate}.\n\n`

    worklogs.forEach((log: any) => {
        output += `ID: ${log.id}\n`
        output += `  Group: ${log.groups?.name} (${log.group_id})\n`
        output += `  Type: ${log.type}\n`
        output += `  Created: ${log.created_at}\n`
        output += '---\n'
    })

    fs.writeFileSync('debug_worklogs_29.txt', output)
    console.log('Output written to debug_worklogs_29.txt')
}

inspectWorklogs()
