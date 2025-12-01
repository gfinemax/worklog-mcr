
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load env vars
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugGroupMembers() {
    console.log('Fetching all groups...')
    const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id, name')

    if (groupError) {
        console.error('Error fetching groups:', groupError)
        return
    }

    console.log(`Found ${groups.length} groups.`)

    let output = ''

    for (const group of groups) {
        console.log(`Checking members for ${group.name} (${group.id})...`)

        // 1. Fetch Group Members (IDs only)
        const { data: memberIds, error: memberError } = await supabase
            .from('group_members')
            .select('user_id, role')
            .eq('group_id', group.id)

        if (memberError) {
            console.error(`Error fetching members for ${group.name}:`, memberError)
            output += `Error fetching members for ${group.name}: ${memberError.message}\n`
            continue
        }

        if (!memberIds || memberIds.length === 0) {
            console.log(`  No members found in group_members table.`)
            output += `Group: ${group.name} (${group.id})\n  No members found.\n\n`
            continue
        }

        // 2. Fetch User Details
        const userIds = memberIds.map((m: any) => m.user_id)
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds)

        if (userError) {
            console.error(`Error fetching users for ${group.name}:`, userError)
            output += `Error fetching users: ${userError.message}\n`
            continue
        }

        console.log(`  Found ${memberIds.length} members (joined with ${users?.length} users).`)
        output += `Group: ${group.name} (${group.id})\n`

        memberIds.forEach((m: any) => {
            const user = users?.find((u: any) => u.id === m.user_id)
            output += `  - ${user?.name || 'Unknown'} (${m.role}) [${m.user_id}]\n`
        })
        output += '\n'
    }

    fs.writeFileSync('debug_members_output.txt', output)
    console.log('Output written to debug_members_output.txt')
}

debugGroupMembers()
