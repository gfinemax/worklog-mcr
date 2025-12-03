
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAnonAccess() {
    console.log('Checking Anon Access to shift_pattern_configs...')

    const { data, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error (Access Denied?):', error)
    } else {
        console.log('Success! Data found:', data?.length)
    }
}

checkAnonAccess()
