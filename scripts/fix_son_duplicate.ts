
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

async function fixDuplicate() {
    console.log("Checking for duplicates...")

    // 1. Find the OLD profile
    const { data: oldUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'son@example.com')
        .single()

    // 2. Find the NEW profile (presumed created by trigger)
    const { data: newUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sonsm@mbcplus.com')
        .single()

    if (newUser) {
        console.log(`Found NEW profile: ${newUser.id}`)

        if (oldUser) {
            console.log(`Found OLD profile: ${oldUser.id}. Merging...`)

            // Update NEW with OLD details
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    role: oldUser.role,
                    type: oldUser.type,
                    organization: oldUser.organization
                    // Add other fields if needed
                })
                .eq('id', newUser.id)

            if (updateError) console.error("Update failed:", updateError)
            else console.log("New profile updated with old details.")

            // Delete OLD
            const { error: delError } = await supabase
                .from('users')
                .delete()
                .eq('id', oldUser.id)

            if (delError) console.error("Delete old failed:", delError)
            else console.log("Old profile deleted.")
        } else {
            // If old user is already gone, check if we need to set role on new
            console.log("Old profile not found (maybe already deleted?). Ensuring New profile roles...")
            const { error } = await supabase.from('users').update({ role: '관리', type: 'support', name: '손수민' }).eq('id', newUser.id)
            if (error) console.log(error)
        }
    } else {
        console.log("New profile NOT found. Something else happened.")
        // If new profile doesn't exist but auth user does?
        // We can just try to create it manually now? 
    }
}

fixDuplicate()
