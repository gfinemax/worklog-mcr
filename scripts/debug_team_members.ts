
import { supabase } from '../lib/supabase'

async function debugTeamMembers() {
    console.log('--- Debugging Team Members ---')

    // 1. Find Group ID for "4조"
    const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('name', '4조')

    if (groupError) {
        console.error('Error fetching group:', groupError)
        return
    }

    if (!groups || groups.length === 0) {
        console.log('Group "4조" not found.')
        // List all groups to see what exists
        const { data: allGroups } = await supabase.from('groups').select('name, id')
        console.log('Available groups:', allGroups)
        return
    }

    const group = groups[0]
    console.log('Found Group:', group)

    // 2. Fetch Members for this Group
    const { data: members, error: memberError } = await supabase
        .from('group_members')
        .select(`
            user_id,
            role,
            users (
                id,
                name,
                email
            )
        `)
        .eq('group_id', group.id)

    if (memberError) {
        console.error('Error fetching members:', memberError)
        return
    }

    console.log(`Found ${members?.length ?? 0} members for group ${group.name}:`)
    members?.forEach(m => {
        console.log(`- ${m.users?.name} (${m.role}) - ${m.users?.email}`)
    })

    if (!members || members.length === 0) {
        console.log('No members found in group_members table.')
    }
}

debugTeamMembers()
