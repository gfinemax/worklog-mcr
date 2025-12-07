
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function deleteOldWorklogs() {
    const targetDate = '2025-12-04'
    console.log(`Deleting worklogs before: ${targetDate}`)

    const { data, count, error } = await supabase
        .from('worklogs')
        .delete({ count: 'exact' })
        .lt('date', targetDate)

    if (error) {
        console.error('Error deleting worklogs:', error)
        return
    }

    console.log(`Successfully deleted ${count} worklogs before ${targetDate}.`)
}

deleteOldWorklogs()
