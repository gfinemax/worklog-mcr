
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteInvalidLog() {
    const invalidLogId = '3e52122b-05f7-4878-bec4-d74a1cbba0de' // 1조 Day on Dec 4th
    console.log(`Deleting invalid worklog: ${invalidLogId}`)

    const { error } = await supabase
        .from('worklogs')
        .delete()
        .eq('id', invalidLogId)

    if (error) {
        console.error('Error deleting log:', error)
    } else {
        console.log('Successfully deleted invalid log.')
    }
}

deleteInvalidLog()
