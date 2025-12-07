
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function fixSessionRoles() {
    const today = new Date().toISOString().split('T')[0]
    console.log(`Checking session for today: ${today}`)

    const { data: sessions, error } = await supabase
        .from('work_sessions')
        .select('*, groups(name)')
        .eq('date', today)
        .eq('status', 'active')

    if (error || !sessions || sessions.length === 0) {
        console.log('No active session found for today.')
        return
    }

    const targetSession = sessions.find(s => s.groups?.name === '1조')
    if (!targetSession) {
        console.log('Found sessions but none for 1조:', sessions.map(s => s.groups?.name))
        return
    }

    console.log('Found 1조 Session:', targetSession.id)

    // 2. Fetch members with explicit join
    const { data: members, error: membersError } = await supabase
        .from('work_session_members')
        .select(`
        id,
        user_id,
        role,
        users ( name )
    `)
        .eq('session_id', targetSession.id)

    if (membersError) {
        console.log('Error fetching members:', membersError.message)
        return
    }

    console.log('Current Members Raw:', JSON.stringify(members, null, 2))

    const park = members?.find(m => m.users?.name === '박상필')
    const kim = members?.find(m => m.users?.name === '김준일')

    if (park && kim) {
        console.log('Updating Park to Director and Kim to Assistant...')

        const { error: err1 } = await supabase.from('work_session_members')
            .update({ role: '감독' })
            .eq('id', park.id)

        const { error: err2 } = await supabase.from('work_session_members')
            .update({ role: '부감독' })
            .eq('id', kim.id)

        if (err1 || err2) {
            console.log('Error updating roles:', err1, err2)
        } else {
            console.log('Updated roles successfully.')
        }
    } else {
        console.log('Could not find Park or Kim in session.')
    }
}

fixSessionRoles()
