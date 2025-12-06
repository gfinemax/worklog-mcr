
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserDuplication() {
    const name = '손수민'
    console.log(`Checking for user: ${name}`)

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)

    if (userError) console.error('Error fetching users:', userError)
    else console.log('Users found:', users)

    const { data: staff, error: staffError } = await supabase
        .from('support_staff')
        .select('*')
        .eq('name', name)

    if (staffError) console.error('Error fetching support_staff:', staffError)
    else console.log('Support Staff found:', staff)
}

checkUserDuplication()
