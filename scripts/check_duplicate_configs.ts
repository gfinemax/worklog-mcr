
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDuplicates() {
    console.log('Checking for duplicate configs...')

    const { data: configs, error } = await supabase
        .from('shift_pattern_configs')
        .select('id, valid_from, created_at')
        .order('valid_from', { ascending: false })

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Configs found:', configs)
}

checkDuplicates()
