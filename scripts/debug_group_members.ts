
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugGroupMembers() {
    console.log('Fetching group members for 1조 and 2조...')

    // Fetch groups first to get IDs
    const { data: groups } = await supabase.from('groups').select('id, name').in('name', ['1조', '2조'])

    if (!groups) {
        console.log('No groups found')
        return
    }

    console.log('Groups:', groups)

    for (const group of groups) {
        const { data: members, error } = await supabase
            .from('group_members')
            .select(`
                user_id,
                user:users(name, role)
            `)
            .eq('group_id', group.id)

        if (error) {
            console.error(`Error fetching members for ${group.name}:`, error)
            continue
        }

        console.log(`${group.name} Members:`, members?.map((m: any) => m.user.name))
    }
}

debugGroupMembers()
