
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOrder() {
    console.log('Fetching group_members with display_order...')

    const { data: members, error } = await supabase
        .from('group_members')
        .select(`
        display_order,
        user:users(name),
        group:groups(name)
    `)
        .order('group_id')
        .order('display_order')

    if (error) {
        console.error('Error:', error)
        return
    }

    if (members) {
        console.log('Found', members.length, 'members')
        let currentGroup = ''
        members.forEach((m: any) => {
            const groupName = m.group?.name
            const userName = m.user?.name
            if (groupName !== currentGroup) {
                console.log(`\n--- ${groupName} ---`)
                currentGroup = groupName
            }
            console.log(`${m.display_order}: ${userName}`)
        })
    }
}

checkOrder()
