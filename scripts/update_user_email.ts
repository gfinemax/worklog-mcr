
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
    console.error('Missing Supabase URL or Service Role Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function updateEmail() {
    const userId = '4ab08afd-025c-4138-9db6-5b63a24206e2' // Derived from previous check
    const newEmail = 'sonsm@mbcplus.com'

    console.log(`Updating user ${userId} to ${newEmail}...`)

    // 1. Update Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { email: newEmail, email_confirm: true }
    )

    if (authError) {
        console.error('Auth update failed:', authError)
        return
    }
    console.log('Auth email updated.')

    // 2. Update Public User Table (if not triggered automatically)
    const { error: dbError } = await supabase
        .from('users')
        .update({ email: newEmail })
        .eq('id', userId)

    if (dbError) {
        console.error('DB update failed:', dbError)
    } else {
        console.log('Public user record updated.')
    }

    console.log('Process complete.')
}

updateEmail()
