
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkGroupUser() {
    // 1. Check schema
    const { data: sample } = await supabase.from('users').select('*').limit(1)
    console.log('User Schema Sample:', sample && sample[0] ? Object.keys(sample[0]) : 'No users found')

    // 2. Try to find members of 1조
    // Assuming column might be 'group_name' or similar, strict check first
    // or just list all users and I will filter in code if needed
    const { data: allUsers } = await supabase.from('users').select('id, name, group_name, role').order('name')

    if (allUsers) {
        const team1 = allUsers.filter(u => u.group_name === '1조')
        console.log('Team 1 Members:', team1)
    }
}

checkGroupUser()
