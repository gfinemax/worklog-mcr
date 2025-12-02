import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectWorklogs() {
    console.log('Inspecting worklogs table...')

    // Fetch one row to see columns
    const { data: logs, error } = await supabase.from('worklogs').select('*').limit(1)

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    if (logs && logs.length > 0) {
        console.log('Columns:', Object.keys(logs[0]))
    } else {
        console.log('No worklogs found.')
    }

    // Check for duplicates
    console.log('Checking for duplicates...')
    // We need to know the column names to select them. If group_id exists, use it.
    // Let's try to select * and process in JS to avoid error if column doesn't exist in select list
    const { data: allLogs, error: allError } = await supabase
        .from('worklogs')
        .select('*')
        .order('date', { ascending: false })

    if (allError) {
        console.error('Error fetching all worklogs:', allError)
        return
    }

    if (allLogs) {
        const map = new Map<string, any[]>()
        allLogs.forEach(log => {
            // Use group_id if available, otherwise team, otherwise group_name
            const groupId = log.group_id || log.team || log.group_name
            const key = `${log.date}-${groupId}-${log.type}`
            if (!map.has(key)) {
                map.set(key, [])
            }
            map.get(key)?.push(log)
        })

        let duplicateCount = 0
        map.forEach((logs, key) => {
            if (logs.length > 1) {
                console.log(`Duplicate found for ${key}: ${logs.length} entries`)
                duplicateCount++
            }
        })

        if (duplicateCount === 0) {
            console.log('No duplicates found in existing data.')
        } else {
            console.log(`Found ${duplicateCount} sets of duplicates.`)
        }
    }
}

inspectWorklogs()
