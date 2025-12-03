
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

async function debugFetch() {
    console.log('Running component query...')

    const { data: users, error } = await supabase
        .from('users')
        .select(`
        id, name, role,
        group_members(groups(name), display_order)
    `)
        .order('name')

    if (error) {
        console.error('Error:', error)
        return
    }

    if (users) {
        console.log(`Fetched ${users.length} users`)
        users.forEach((u: any) => {
            const groupName = u.group_members?.[0]?.groups?.name || 'Unassigned'
            const displayOrder = u.group_members?.[0]?.display_order
            if (groupName !== 'Unassigned') {
                console.log(`${u.name} (${groupName}): Order ${displayOrder}`)
            }
        })
    }
}

debugFetch()
