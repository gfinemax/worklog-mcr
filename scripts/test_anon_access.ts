
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

// Explicitly use Anon Key
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAnonAccess() {
    console.log('Testing access to shift_pattern_configs with ANON KEY...')

    const { data, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .limit(1)

    if (error) {
        console.error('ACCESS DENIED or ERROR:', error)
    } else {
        console.log('ACCESS GRANTED. Found configs:', data?.length)
    }
}

testAnonAccess()
