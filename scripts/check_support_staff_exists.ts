
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkTable() {
    console.log('Checking if support_staff table exists...')
    const { error } = await supabase.from('support_staff').select('count', { count: 'exact', head: true })

    if (error) {
        // If error code is 42P01 (undefined_table), it doesn't exist.
        if (error.code === '42P01') {
            console.log('Table "support_staff" does NOT exist.')
        } else {
            console.log(`Error checking table: ${error.message} (Code: ${error.code})`)
        }
    } else {
        console.log('Table "support_staff" EXISTS.')
    }
}

checkTable()
