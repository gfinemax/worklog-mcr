
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGroupsAndMembers() {
    console.log('Checking groups...')
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')

    if (groupsError) {
        console.error('Error fetching groups:', groupsError)
        return
    }

    console.log('Groups found:', groups)

    for (const group of groups) {
        console.log(`\nChecking members for group: ${group.name} (${group.id})`)
        const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select(`
        user_id,
        role,
        users (
          id,
          name
        )
      `)
            .eq('group_id', group.id)

        if (membersError) {
            console.error(`Error fetching members for ${group.name}:`, membersError)
        } else {
            console.log(`Members count: ${members.length}`)
            members.forEach(m => {
                // @ts-ignore
                console.log(`- ${m.users?.name} (${m.role})`)
            })
        }
    }
}

checkGroupsAndMembers()
