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

async function cleanupDuplicates() {
    console.log('Fetching all worklogs...')
    const { data: allLogs, error } = await supabase
        .from('worklogs')
        .select('*')
        .order('created_at', { ascending: false })

    if (error || !allLogs) {
        console.error('Error fetching worklogs:', error)
        return
    }

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

    let deletedCount = 0
    for (const [key, logs] of map.entries()) {
        if (logs.length > 1) {
            console.log(`Found ${logs.length} duplicates for ${key}`)

            // Keep the one with the most content (e.g. most posts in channelLogs)
            // Or just the latest updated one.
            // Let's sort by updated_at desc
            logs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

            const [keep, ...remove] = logs
            console.log(`Keeping ${keep.id} (updated: ${keep.updated_at})`)

            for (const log of remove) {
                console.log(`Removing ${log.id} (updated: ${log.updated_at})`)
                const { error: deleteError } = await supabase
                    .from('worklogs')
                    .delete()
                    .eq('id', log.id)

                if (deleteError) {
                    console.error(`Failed to delete ${log.id}:`, deleteError)
                } else {
                    deletedCount++
                }
            }
        }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} duplicate logs.`)
}

cleanupDuplicates()
