
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function assignTeam() {
    const userId = '625339d2-18b4-4cc1-9d79-52f775b34b71' // limjh UUID

    // 1. Find '운영팀' Group ID
    const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('name', '운영팀')
        .single()

    if (groupError || !groups) {
        console.error("Could not find '운영팀'. Listing all groups:")
        const { data: allGroups } = await supabase.from('groups').select('id, name')
        console.log(allGroups)
        return
    }

    console.log(`Found Group: ${groups.name} (${groups.id})`)

    // 2. Update User Type to 'support' (지원)
    const { error: userError } = await supabase
        .from('users')
        .update({ type: 'support', role: 'director' }) // Assuming 'director' or appropriate role for Operation Team support? User said "지원 운영팀". Usually 'support' type. Role might be 'director' or 'staff'. Let's default to 'director' if usually they sign? Or just keep existing role?
        // Wait, let's just set type='support'.
        .eq('id', userId)

    if (userError) console.error("Error updating user type:", userError)
    else console.log("User type updated to 'support'")

    // 3. Add to Group Members
    const { error: memberError } = await supabase
        .from('group_members')
        .insert({
            group_id: groups.id,
            user_id: userId,
            role: 'director' // Default role in group?
        })

    if (memberError) {
        if (memberError.code === '23505') console.log("User already in group.")
        else console.error("Error adding to group:", memberError)
    } else {
        console.log("User successfully added to '운영팀'")
    }
}

assignTeam()
