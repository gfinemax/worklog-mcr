
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
    console.log("--- Updating Lim Geun Hyung's Role ---")

    // 1. Fetch User
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .ilike('name', '%임근형%')
        .single()

    if (error || !user) {
        console.error("User not found or error:", error)
        return
    }

    console.log("Current Record:", { name: user.name, role: user.role })

    // 2. Parse and Modify Role
    // Roles are likely stored as "감독, 기술스텝" or distinct tags
    let currentRoles = user.role ? user.role.split(',').map((r: string) => r.trim()) : []

    // Remove 'director' and '감독'
    const newRoles = currentRoles.filter((r: string) => r !== 'director' && r !== '감독')

    if (newRoles.length === currentRoles.length) {
        console.log("No 'director' role found to remove.")
        return
    }

    const newRoleString = newRoles.join(', ')

    console.log("New Role String:", newRoleString)

    // 3. Update
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: newRoleString })
        .eq('id', user.id)

    if (updateError) {
        console.error("Update failed:", updateError)
    } else {
        console.log("Successfully updated role.")
    }
}

main()
