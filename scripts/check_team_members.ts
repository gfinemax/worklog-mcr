
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkTeams() {
    const teams = ['3조', '5조']

    for (const team of teams) {
        console.log(`--- Members of ${team} ---`)
        const { data: group } = await supabase.from('groups').select('id').eq('name', team).single()
        if (!group) {
            console.log('Group not found')
            continue
        }

        const { data: members } = await supabase
            .from('group_members')
            .select('users(name, role)')
            .eq('group_id', group.id)

        if (members) {
            members.forEach((m: any) => {
                console.log(`${m.users.name} (${m.users.role})`)
            })
        }
    }
}

checkTeams()
