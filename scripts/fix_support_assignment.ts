
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function fixAssignment() {
    // 1. List members of '지원팀'
    const { data: supportGroup } = await supabase
        .from('groups')
        .select('id, name, group_members(user_id, role, users(name, email, role))')
        .eq('name', '지원팀')
        .single()

    if (supportGroup) {
        console.log(`=== ${supportGroup.name} Members ===`)
        supportGroup.group_members.forEach((m: any) => {
            console.log(`- ${m.users?.name} (${m.users?.role})`)
        })
    } else {
        console.log("Could not find '지원팀'")
        return
    }

    // 2. Assign limjh (625339d2...) to '지원팀'
    const userId = '625339d2-18b4-4cc1-9d79-52f775b34b71'

    // Check if already in
    const isMember = supportGroup.group_members.some((m: any) => m.user_id === userId)
    if (!isMember) {
        console.log(`Assigning limjh to ${supportGroup.name}...`)
        const { error } = await supabase.from('group_members').insert({
            group_id: supportGroup.id,
            user_id: userId,
            role: 'director' // Default role
        })
        if (error) console.error("Error link:", error)
        else console.log("Success!")
    } else {
        console.log("limjh is already in 지원팀.")
    }
}

fixAssignment()
