
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkGroupUser() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', '3조')
        .single()

    if (error) {
        console.log('Error or not found:', error.message)
    } else {
        console.log('Found user:', data)
    }
}

checkGroupUser()
