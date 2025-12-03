
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check4Jo() {
    const groupName = '4조'
    console.log(`Inspecting members for group: ${groupName}`)

    const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('name', groupName)
        .single()

    if (!group) {
        console.log('Group not found')
        return
    }

    const { data: members } = await supabase
        .from('group_members')
        .select(`
      user_id,
      role,
      users (name)
    `)
        .eq('group_id', group.id)

    if (members) {
        members.forEach((m: any) => {
            console.log(`- ${m.users.name} (${m.role})`)
        })
    }
}

check4Jo()
