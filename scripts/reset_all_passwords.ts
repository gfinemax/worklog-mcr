
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in .env.local')
    console.error('Make sure SUPABASE_SERVICE_ROLE_KEY is defined.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function resetPasswords() {
    console.log('Fetching all users...')

    // Fetch all users from public users table (which mirrors auth users)
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name')

    if (error) {
        console.error('Error fetching users from DB:', error)
        return
    }

    if (!users || users.length === 0) {
        console.log('No users found in public.users table.')
        return
    }

    console.log(`Found ${users.length} users in public.users. Resetting passwords to '12341234'...`)

    for (const user of users) {
        process.stdout.write(`Resetting password for ${user.email}... `)
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: '12341234' }
        )

        if (updateError) {
            console.log(`FAILED: ${updateError.message}`)
        } else {
            console.log(`DONE`)
        }
    }

    console.log('\nAll password reset operations completed.')
}

resetPasswords()
