
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkOldWorklogs() {
    const targetDate = '2025-12-04'
    console.log(`Checking worklogs before: ${targetDate}`)

    const { count, error } = await supabase
        .from('worklogs')
        .select('*', { count: 'exact', head: true })
        .lt('date', targetDate)

    if (error) {
        console.error('Error counting worklogs:', error)
        return
    }

    console.log(`Found ${count} worklogs before ${targetDate}.`)

    if (count && count > 0) {
        const { data } = await supabase
            .from('worklogs')
            .select('id, date, group_name')
            .lt('date', targetDate)
            .limit(5)
        console.log('Sample data:', data)
    }
}

checkOldWorklogs()
