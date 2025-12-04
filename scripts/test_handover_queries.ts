
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for script
const supabase = createClient(supabaseUrl, supabaseKey)

async function testQueries() {
    console.log("Testing Handover Queries...")

    // 1. Fetch a group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .limit(1)
        .single()

    if (groupError) {
        console.error("Error fetching group:", groupError)
        return
    }
    console.log("Group found:", group.name, group.id)

    // 2. Test LoginForm query (fetch members)
    console.log("Testing LoginForm member fetch...")
    const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
            user_id,
            role,
            users (
                id,
                name,
                profile_image_url
            )
        `)
        .eq('group_id', group.id)

    if (memberError) {
        console.error("Error fetching members:", memberError)
    } else {
        console.log("Members fetched successfully:", memberData?.length)
    }

    // 3. Test SessionSetupStep query (fetch roles)
    console.log("Testing SessionSetupStep role fetch...")
    const { data: roles, error: roleError } = await supabase
        .from("roles")
        .select("name")
        .eq("type", "both")
        .order("order")

    if (roleError) {
        console.error("Error fetching roles:", roleError)
    } else {
        console.log("Roles fetched successfully:", roles?.length)
    }

    // 4. Test SessionSetupStep search query
    console.log("Testing SessionSetupStep search...")
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, role, profile_image_url')
        .limit(1)

    if (userError) {
        console.error("Error fetching users:", userError)
    } else {
        console.log("Users search test success")
    }
}

testQueries()
