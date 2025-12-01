
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
        .select('count(*)', { count: 'exact', head: true })

    if (error) {
        console.log('Error or Table not found:', error.message)
    } else {
        console.log('Table found. Count:', data) // data is null for head:true usually, but no error means table exists
    }
}

checkTable()
