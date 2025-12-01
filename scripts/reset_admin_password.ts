
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const EMAIL = 'admin@mbcplus.com'
const PASSWORD = 'password1234' // Temporary password

async function resetPassword() {
    console.log(`--- Resetting Password for ${EMAIL} ---`)

    // 1. Check if user exists in Auth
    // We can't select from auth.users directly with client, but we can try to getUserById if we knew it, 
    // or list users (admin only).

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error('Error listing users:', listError)
        return
    }

    const user = users.find(u => u.email === EMAIL)

    if (user) {
        console.log(`User found (ID: ${user.id}). Updating password...`)
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: PASSWORD }
        )
        if (updateError) {
            console.error('Error updating password:', updateError)
        } else {
            console.log(`Password updated successfully to: ${PASSWORD}`)
        }
    } else {
        console.log('User not found in Auth. Creating user...')
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: EMAIL,
            password: PASSWORD,
            email_confirm: true
        })
        if (createError) {
            console.error('Error creating user:', createError)
        } else {
            console.log(`User created successfully with password: ${PASSWORD}`)
            // Also ensure public.users entry exists? 
            // The app likely relies on triggers or manual sync. 
            // Let's check public.users too.
        }
    }
}

resetPassword()
