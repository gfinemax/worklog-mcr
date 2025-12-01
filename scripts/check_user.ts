
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
    console.log('Checking user "yoonjh@mbcplus"...')

    // Check public.users table
    const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'yoonjh@mbcplus') // Assuming email is stored in public.users or we can search by name if email is not there
        .maybeSingle()

    if (publicError) {
        console.error('Error checking public.users:', publicError)
    } else {
        console.log('Public user found:', publicUser)
    }

    // Check by name if email search fails
    if (!publicUser) {
        const { data: publicUserByName, error: publicErrorByName } = await supabase
            .from('users')
            .select('*')
            .eq('name', '윤주현')
            .maybeSingle()

        if (publicUserByName) {
            console.log('Public user found by name:', publicUserByName)
        }
    }
}

checkUser()
