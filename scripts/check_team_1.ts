
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

async function checkTeamMembers() {
    console.log('Checking members of 1조...')

    const { data: members, error } = await supabase
        .from('group_members')
        .select(`
        user:users (
            name,
            role
        ),
        groups (
            name
        )
    `)
        .eq('groups.name', '1조')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Members of 1조:')
    members.forEach((m: any) => {
        console.log(`- ${m.user.name}: ${m.user.role}`)
    })
}

checkTeamMembers()
