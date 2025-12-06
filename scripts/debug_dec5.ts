import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectData() {
    console.log('--- Inspecting Worklogs for 2025-12-05 ---')
    const { data: worklogs, error: worklogError } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', '2025-12-05')

    if (worklogError) {
        console.error('Error fetching worklogs:', worklogError)
    } else {
        worklogs.forEach(log => {
            console.log(`ID: ${log.id}, Group: ${log.group_name}, Type: ${log.type}, Status: ${log.status}`)
            console.log('Workers:', JSON.stringify(log.workers, null, 2))
        })
    }

    console.log('\n--- Inspecting Group Members for Team 3 & 4 ---')
    const { data: members, error: memberError } = await supabase
        .from('group_members')
        .select(`
      *,
      groups (name),
      users (name)
    `)
        .in('groups.name', ['3조', '4조'])

    if (memberError) {
        console.error('Error fetching members:', memberError)
    } else {
        // Filter manually because inner join filtering in Supabase is tricky with dot notation in select
        const filteredMembers = members.filter((m: any) => ['3조', '4조'].includes(m.groups?.name))

        filteredMembers.forEach((m: any) => {
            console.log(`Group: ${m.groups?.name}, User: ${m.users?.name}, Role: ${m.role}`)
        })
    }
}

inspectData()
