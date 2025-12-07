
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

async function assignGroup() {
    const email = 'sonsm@mbcplus.com'

    // 1. Get User
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single()
    if (!user) { console.error("User not found"); return }

    // 2. Get Group 5
    const { data: group } = await supabase.from('groups').select('id').eq('name', '5조').single()
    if (!group) { console.error("Group 5 not found"); return }

    // 3. Insert Membership
    const { error } = await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: '부감독' // Assigning a role
    })

    if (error) {
        console.error("Insert failed:", error)
    } else {
        console.log("Assigned sonsm to 5조 as 부감독")
    }
}

assignGroup()
