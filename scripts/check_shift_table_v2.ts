
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkTable() {
    const { data, error } = await supabase
        .from('shift_configs')
        .select('*')
        .limit(1)

    if (error) {
        console.log('Error:', error.message)
    } else {
        console.log('Table found. Data:', JSON.stringify(data, null, 2))
    }
}

checkTable()
