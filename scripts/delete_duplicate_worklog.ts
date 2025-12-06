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

async function deleteWorklog(id: string) {
    console.log(`Attempting to delete worklog: ${id}`)

    const { error } = await supabase
        .from('worklogs')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting worklog:', error)
    } else {
        console.log('Successfully deleted worklog.')
    }
}

// ID for '3조 주간' (created at 12:53 PM) identified in previous step
const targetId = 'be2089c8-d8e6-4778-ada7-8fa2ea35c2ae'

deleteWorklog(targetId)
