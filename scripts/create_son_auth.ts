
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

async function fixUser() {
    const targetName = '손수민'
    const newEmail = 'sonsm@mbcplus.com'
    const password = '12341234'

    console.log(`Fixing user ${targetName}...`)

    // 1. Get current public user text
    const { data: publicUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('name', targetName)
        .single()

    if (findError) {
        console.error('Could not find public user:', findError)
        return
    }
    console.log(`Found public user: ${publicUser.id} (${publicUser.email})`)

    // 2. Create Auth User
    console.log(`Creating Auth user ${newEmail}...`)
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: newEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name: targetName }
    })

    if (createError) {
        console.error('Error creating auth user:', createError)
        return
    }

    const newAuthId = authUser.user.id
    console.log(`Created Auth user with ID: ${newAuthId}`)

    // 3. Update public user ID to match new Auth ID
    // We also update email to match
    console.log(`Updating public user to match Auth ID...`)

    // Note: Updating PK 'id' can be tricky if deferred constraints or dependencies exist.
    // If it fails, we might need to delete and recreate (preserving data if possible).
    const { error: updateError } = await supabase
        .from('users')
        .update({
            id: newAuthId,
            email: newEmail
        })
        .eq('id', publicUser.id)

    if (updateError) {
        console.error('Failed to update public user ID:', updateError)
        console.log('Attempting delete and re-insert approach (ignoring dependencies for now)...')

        // Fallback: Delete old, Insert new
        const { error: delError } = await supabase.from('users').delete().eq('id', publicUser.id)
        if (delError) {
            console.error('Delete failed:', delError)
            return
        }

        const newUserPayload = { ...publicUser, id: newAuthId, email: newEmail }
        const { error: insError } = await supabase.from('users').insert(newUserPayload)

        if (insError) {
            console.error('Re-insert failed:', insError)
        } else {
            console.log('Re-insert successful.')
        }

    } else {
        console.log('Public user ID updated successfully.')
    }
}

fixUser()
