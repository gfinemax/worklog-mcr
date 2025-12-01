
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLS() {
    console.log('--- Checking RLS Policies ---')

    // We can't easily check pg_policies via client unless we have a function for it.
    // But we can try to fetch group_members as an anonymous user (which we are here).

    // 1. Get Group ID for 4조
    const { data: group } = await supabase.from('groups').select('id').eq('name', '4조').single()
    if (!group) {
        console.log('Group 4조 not found')
        return
    }
    console.log('Group ID:', group.id)

    // 2. Try to fetch members as Anon
    const { data: members, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)

    if (error) {
        console.error('Error fetching members as Anon:', error)
    } else {
        console.log(`Fetched ${members?.length} members as Anon.`)
    }
}

checkRLS()
