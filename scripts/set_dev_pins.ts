
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setDevPins() {
    console.log('Setting development PIN codes...')

    // 1. Get all groups
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')

    if (groupsError || !groups) {
        console.error('Error fetching groups:', groupsError)
        return
    }

    console.log('Found groups:', groups.map(g => g.name).join(', '))

    // 2. Process each group
    for (const group of groups) {
        // Extract group number (e.g., "1조" -> "1")
        const match = group.name.match(/(\d+)조/)
        if (!match) {
            console.log(`Skipping group ${group.name} (no number found)`)
            continue
        }

        const groupNum = match[1]
        const pinCode = `123${groupNum}`

        console.log(`Processing ${group.name} -> Setting PIN to ${pinCode}`)

        // 3. Get members of this group
        const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id)

        if (membersError || !members || members.length === 0) {
            console.log(`  No members found for ${group.name}`)
            continue
        }

        const userIds = members.map(m => m.user_id)

        // 4. Update users
        const { error: updateError } = await supabase
            .from('users')
            .update({ pin_code: pinCode })
            .in('id', userIds)

        if (updateError) {
            console.error(`  Failed to update PINs for ${group.name}:`, updateError)
        } else {
            console.log(`  Successfully updated ${userIds.length} users in ${group.name}`)
        }
    }

    // Also set admin PIN
    const { error: adminError } = await supabase
        .from('users')
        .update({ pin_code: '1234' })
        .eq('email', 'admin@mbcplus.com')

    if (!adminError) {
        console.log('Set admin PIN to 1234')
    }

    console.log('\nDone!')
}

setDevPins()
