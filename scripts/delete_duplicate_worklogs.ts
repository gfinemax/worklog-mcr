
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteDuplicateWorklogs() {
    console.log('Fetching worklogs to check for duplicates...')
    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('id, date, type, group_id, created_at')
        .order('created_at', { ascending: false }) // Newest first

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    const seen = new Set()
    const toDelete: string[] = []
    const kept: string[] = []

    for (const log of worklogs) {
        const key = `${log.group_id}_${log.date}_${log.type}`
        if (seen.has(key)) {
            toDelete.push(log.id)
        } else {
            seen.add(key)
            kept.push(log.id)
        }
    }

    console.log(`Total worklogs: ${worklogs.length}`)
    console.log(`Unique entries to keep: ${kept.length}`)
    console.log(`Duplicates to delete: ${toDelete.length}`)

    if (toDelete.length > 0) {
        console.log('Deleting duplicates...')
        const { error: deleteError } = await supabase
            .from('worklogs')
            .delete()
            .in('id', toDelete)

        if (deleteError) {
            console.error('Error deleting duplicates:', deleteError)
        } else {
            console.log('Successfully deleted duplicates.')
        }
    } else {
        console.log('No duplicates found.')
    }
}

deleteDuplicateWorklogs()
