
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
    console.log('Checking for user 정광훈...')

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('name', '정광훈')

    if (userError) {
        console.error('User Query Error:', userError)
    } else {
        console.log('User Query Result:', JSON.stringify(userData, null, 2))
    }

    console.log('Checking for external staff 손수민...')
    const { data: staffData, error: staffError } = await supabase
        .from('external_staff')
        .select('*')
        .eq('name', '손수민')

    if (staffError) {
        console.error('Staff Query Error:', staffError)
    } else {
        console.log('Staff Query Result:', JSON.stringify(staffData, null, 2))
    }
}

testQuery()
