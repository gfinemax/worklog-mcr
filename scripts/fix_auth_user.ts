
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials (URL or Service Role Key)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const TARGET_EMAIL = 'yoonjh@mbcplus'
const TEMP_PASSWORD = 'password1234' // Simple temp password

async function fixAuthUser() {
    console.log(`Attempting to fix auth for ${TARGET_EMAIL}...`)

    // 1. Get Public User ID
    const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('email', TARGET_EMAIL)
        .single()

    if (publicError) {
        console.error('Public user not found:', publicError)
        // If public user missing, we can just create everything new?
        // But user said they want to login, implying they exist.
        // Let's proceed to try create auth user anyway.
    } else {
        console.log(`Public user found (ID: ${publicUser.id}).`)

        // 2. Try to update Auth User using Public ID
        console.log(`Attempting to reset password for Auth ID: ${publicUser.id}...`)
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            publicUser.id,
            { password: TEMP_PASSWORD }
        )

        if (!updateError) {
            console.log(`SUCCESS! Password reset to: ${TEMP_PASSWORD}`)
            return
        }

        console.log('Update failed (User not found or ID mismatch):', updateError.message)
    }

    // 3. If update failed, try to Create Auth User
    console.log('Attempting to create new Auth user...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TARGET_EMAIL,
        password: TEMP_PASSWORD,
        email_confirm: true
    })

    if (createError) {
        console.error('Error creating user:', createError)
        if (createError.message.includes('already registered')) {
            console.log('CRITICAL: User already registered but ID does not match public user.')
            console.log('We need to find the real Auth ID. Retrying listUsers...')

            const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
            if (listError) {
                console.error('listUsers failed again:', listError)
            } else {
                const authUser = listData.users.find(u => u.email === TARGET_EMAIL)
                if (authUser) {
                    console.log(`Found real Auth ID: ${authUser.id}`)
                    // Update public user to match
                    const { error: updateIdError } = await supabase
                        .from('users')
                        .update({ id: authUser.id })
                        .eq('email', TARGET_EMAIL)

                    if (updateIdError) {
                        console.error('Failed to update public user ID:', updateIdError)
                    } else {
                        console.log('Updated public user ID to match Auth ID.')
                        // Reset password for this auth user
                        await supabase.auth.admin.updateUserById(authUser.id, { password: TEMP_PASSWORD })
                        console.log(`Password reset to: ${TEMP_PASSWORD}`)
                    }
                }
            }
        }
        return
    }

    console.log(`Created new Auth user (ID: ${newUser.user.id}).`)

    // 4. Update Public User ID to match new Auth ID
    if (publicUser) {
        console.log('Updating public user ID to match new Auth ID...')
        const { error: updateIdError } = await supabase
            .from('users')
            .update({ id: newUser.user.id })
            .eq('email', TARGET_EMAIL)

        if (updateIdError) {
            console.error('Failed to update public user ID:', updateIdError)
            // If update fails (e.g. FK constraint), we might need to delete old row and insert new?
            // But let's hope it works.
        } else {
            console.log('Successfully updated public user ID.')
        }
    } else {
        // Create public user if it didn't exist
        // ...
    }
}

fixAuthUser()
