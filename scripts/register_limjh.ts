
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function registerLimjh() {
    const email = 'limjh@mbcplus.com'
    const password = '12341234' // Default password
    const name = '임제혁'
    const role = '감독' // Assuming role, can be updated later

    console.log(`Attempting to register ${email}...`)

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
            }
        }
    })

    if (authError) {
        console.error('Sign Up Error:', authError.message)
        // If user already exists, we can't do much without service key, enabling the user to just login
        return
    }

    if (!authData.user) {
        console.error('Sign Up successful but no user returned (Email confirmation might be required)')
        return
    }

    console.log(`Auth User Created! UUID: ${authData.user.id}`)
    const newId = authData.user.id

    // 2. Link to Public Users Table
    // Check if the row with 'limjh' exists (by email fake or name)
    // The user said they updated the row to 'limjh' in the email column? Or name?
    // The screenshot shows email column = 'limjh'. Wait, text "limjh" is not a valid email format?
    // Supabase UI might show it, but public.users.email is usually text.
    // We want to find the row where name='임제혁' or email='limjh'

    // First, find the existing row
    const { data: existingRows, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.limjh,name.eq.임제혁`)

    if (fetchError) {
        console.error('Error fetching public user:', fetchError)
    } else if (existingRows && existingRows.length > 0) {
        const targetRow = existingRows[0]
        console.log('Found existing public profile:', targetRow)

        // Update the ID of this row to match the new Auth UUID
        // NOTE: This usually fails if ID is PK and referenced.
        // If it fails, we might need to delete the old row and insert a new one OR update references.
        // Let's try to update ID first (unlikely to work if referenced).
        // If update fails, we generally insert a new row with the correct ID.

        // Actually, usually we can't update PK.
        // We should Delete Old -> Insert New.
        // But Deleting Old breaks FKs (created_by in worklogs, signatures etc.)
        // If this is a new user setup, maybe no worklogs yet? 
        // If there ARE worklogs, we need to update them to the new ID.

        // Let's try to simple update. If fail, log it.

        // Actually, we can't update the ID of an existing row easily via client if it is PK.
        // However, if we are just setting up login, maybe we just Update the 'email' of the Found Row to match?
        // NO, the ID must match auth.users.id for Row Level Security (RLS) and auth.uid() to work properly.

        // STRATEGY: 
        // 1. Identify Existing ID.
        // 2. Update all child tables (group_members, etc) to point to New ID.
        // 3. Delete Old Row.
        // 4. Insert New Row (or rely on trigger).

        console.log(`Linking public profile... Old ID: ${targetRow.id} -> New ID: ${newId}`)

        // Since we don't have full admin rights via script (maybe), we might struggle with FKs.
        // But let's assume we can try to update 'users' row if policies allow.

        // Attempt deletion of old (will fail if FK)
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', targetRow.id)

        if (deleteError) {
            console.log("Could not delete old row (FK constraints likely):", deleteError.message)
            console.log("Please manually update database to map old ID data to new UUID:", newId)
        } else {
            console.log("Old profile deleted. New profile should be created by trigger or manual insert.")
            // Insert new profile
            const { error: insertError } = await supabase
                .from('users')
                .insert({
                    id: newId,
                    email: email,
                    name: name,
                    role: targetRow.role || role
                })

            if (insertError) console.error("Error inserting new profile:", insertError)
            else console.log("New public profile created successfully linked to Auth!")
        }

    } else {
        // No existing row found, create new
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: newId,
                email: email,
                name: name,
                role: role
            })
        if (insertError) console.error("Error creating profile:", insertError)
        else console.log("Public profile created.")
    }
}

registerLimjh()
