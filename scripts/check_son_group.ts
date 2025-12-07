
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import dotenv from 'dotenv'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkGroups() {
    const email = 'sonsm@mbcplus.com'
    console.log(`Checking groups for ${email}...`)

    // 1. Get User ID
    const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single()
    if (!user) {
        console.log("User not found!")
        return
    }
    console.log(`User ID: ${user.id}`)

    // 2. Check Group Members
    const { data: members, error } = await supabase
        .from('group_members')
        .select('group_id, role, groups(name)')
        .eq('user_id', user.id)

    if (error) {
        console.error("Error fetching group members:", error)
    } else {
        console.log("Group Memberships:", JSON.stringify(members, null, 2))
    }
}

checkGroups()
