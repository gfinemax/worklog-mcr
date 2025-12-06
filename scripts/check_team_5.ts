
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTeam5Members() {
    console.log('Fetching members for Team 5 (5조)...')

    // Get Group ID for 5조
    const { data: group } = await supabase.from('groups').select('id').eq('name', '5조').single()

    if (!group) {
        console.error('Group 5조 not found')
        return
    }

    const { data: members, error } = await supabase
        .from('group_members')
        .select(`
            role,
            users (name, email)
        `)
        .eq('group_id', group.id)

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Members of 5조:', members)
}

checkTeam5Members()
