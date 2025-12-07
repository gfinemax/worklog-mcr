
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkDisplayOrder() {
    console.log('Checking display order for 1조...')

    // 1. Get Group ID from groups table
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('name', '1조')
        .single()

    if (groupError || !group) {
        console.log('Group 1조 not found in groups table.', groupError?.message)
        // Fallback: List all groups to see names
        const { data: allGroups } = await supabase.from('groups').select('name')
        console.log('Available Groups:', allGroups)
        return
    }

    console.log('Group ID:', group.id)

    const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
        user_id,
        role,
        display_order,
        users ( name )
    `)
        .eq('group_id', group.id)
        .order('display_order', { ascending: true })

    if (membersError) {
        console.log('Error fetching members:', membersError.message)
        return
    }

    console.log('Members Display Order:', JSON.stringify(members, null, 2))
}

checkDisplayOrder()
