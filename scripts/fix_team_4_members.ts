
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Key for admin tasks if available, else Anon might fail on writes if RLS is strict

// Fallback to Anon key if Service key is missing (though writes might fail depending on RLS)
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const TEAM_NAME = '4조'
const MEMBERS = [
    { name: '김희성', role: '감독', email: 'heeseung@mbcplus.com' },
    { name: '권영춘', role: '부감독', email: 'youngchun@mbcplus.com' },
    { name: '심창규', role: '영상', email: 'changgyu@mbcplus.com' }
]

async function fixTeam4() {
    console.log(`--- Fixing Members for ${TEAM_NAME} ---`)

    // 1. Get Group ID
    const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', TEAM_NAME)
        .single()

    if (groupError || !groups) {
        console.error('Error fetching group:', groupError)
        return
    }
    const groupId = groups.id
    console.log(`Group ID for ${TEAM_NAME}:`, groupId)

    // 2. Ensure Users Exist and Link to Group
    for (const member of MEMBERS) {
        // Check if user exists
        let userId: string | null = null

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('name', member.name)
            .single()

        if (existingUser) {
            console.log(`User ${member.name} exists (${existingUser.id})`)
            userId = existingUser.id
        } else {
            console.log(`Creating user ${member.name}...`)
            // Note: Creating auth users usually requires admin API. 
            // Here we are inserting into 'public.users' table directly.
            // If the app relies on auth.users, this might be insufficient for actual login, 
            // but for "Worker Display" which reads from public.users, this is enough.

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    name: member.name,
                    email: member.email,
                    role: 'USER', // Default system role
                    position: member.role // Store role in position or just rely on group_members
                })
                .select()
                .single()

            if (createError) {
                console.error(`Failed to create user ${member.name}:`, createError)
                continue
            }
            userId = newUser.id
        }

        if (userId) {
            // 3. Link to Group
            // Check if link exists
            const { data: link } = await supabase
                .from('group_members')
                .select('*')
                .eq('group_id', groupId)
                .eq('user_id', userId)
                .single()

            if (link) {
                console.log(`User ${member.name} already in group. Updating role...`)
                await supabase
                    .from('group_members')
                    .update({ role: member.role })
                    .eq('id', link.id)
            } else {
                console.log(`Adding ${member.name} to group...`)
                const { error: linkError } = await supabase
                    .from('group_members')
                    .insert({
                        group_id: groupId,
                        user_id: userId,
                        role: member.role
                    })

                if (linkError) {
                    console.error(`Failed to link ${member.name}:`, linkError)
                }
            }
        }
    }
    console.log('--- Done ---')
}

fixTeam4()
