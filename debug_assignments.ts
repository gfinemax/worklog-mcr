
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugAssignments() {
    // 1. Fetch active config (mimic fetching the config being edited)
    const today = new Date().toISOString().split('T')[0]
    const { data: config } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (!config) {
        console.error("No active config found")
        return
    }

    console.log("Active Config Teams:", config.pattern_json.flatMap((p: any) => [p.A.team, p.N.team]))

    // 2. Fetch users
    const { data: users } = await supabase
        .from('users')
        .select('id, name, group_members(groups(name))')

    const assignments: any[] = []
    if (users) {
        users.forEach((u: any) => {
            const groupName = u.group_members?.[0]?.groups?.name
            // console.log(`User: ${u.name}, Group: ${groupName}`)

            if (groupName && config.pattern_json.some((p: any) => p.A.team === groupName || p.N.team === groupName)) {
                assignments.push({
                    workerId: u.id,
                    team: groupName,
                    name: u.name
                })
            } else {
                // Add to Unassigned if not in any of the active teams
                assignments.push({
                    workerId: u.id,
                    team: 'Unassigned',
                    name: u.name
                })
            }
        })
    }

    const unassigned = assignments.filter(a => a.team === 'Unassigned')
    console.log(`Total Assignments: ${assignments.length}`)
    console.log(`Unassigned Count: ${unassigned.length}`)
    console.log("Unassigned Names:", unassigned.map(a => a.name))
}

debugAssignments()
