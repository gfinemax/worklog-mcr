
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkWorklogStaff() {
    console.log('Checking worklog_staff table...')

    const { data: sample, error } = await supabase
        .from('worklog_staff')
        .select('*')
        .limit(5)

    if (error) {
        console.error('Error fetching worklog_staff:', error)
        return
    }

    console.log('Sample data:', sample)

    if (sample && sample.length > 0) {
        console.log('Columns:', Object.keys(sample[0]))
    } else {
        console.log('Table is empty.')
    }
}

checkWorklogStaff()
