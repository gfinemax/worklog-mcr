
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixWorklogWorkers() {
    console.log('--- Fixing Worklog Workers Data ---')

    const targetDate = '2025-12-03'
    const targetType = '주간'

    // 1. Fetch the worklog
    const { data: worklogs, error: worklogError } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', targetDate)
        .eq('type', targetType)
        .limit(1)

    if (worklogError) {
        console.error('Error fetching worklog:', worklogError)
        return
    }

    if (!worklogs || worklogs.length === 0) {
        console.log('No worklog found for', targetDate, targetType)
        return
    }

    const log = worklogs[0]
    // Handle both 'team' and 'groupName' (DB column is likely 'team' based on previous debug, but let's check both)
    const groupName = log.team || log.groupName || log.group_name

    console.log(`Found Worklog ID: ${log.id}`)
    console.log(`Group Name: ${groupName}`)

    if (!groupName) {
        console.error('Group name is missing in worklog')
        return
    }

    // 2. Fetch correct group members
    const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', groupName)
        .single()

    if (groupError || !groupData) {
        console.error('Error fetching group:', groupError)
        return
    }

    const { data: members, error: memberError } = await supabase
        .from('group_members')
        .select(`
          display_order,
          user:users(name, role)
      `)
        .eq('group_id', groupData.id)
        .order('display_order')

    if (memberError) {
        console.error('Error fetching members:', memberError)
        return
    }

    // 3. Construct correct workers object
    const newWorkers = {
        director: [] as string[],
        assistant: [] as string[],
        video: [] as string[]
    }

    if (members) {
        members.forEach((m: any) => {
            const name = m.user?.name
            const role = m.user?.role || ''

            if (name) {
                const primaryRole = role.split(',')[0].trim()
                if (primaryRole === '감독') newWorkers.director.push(name)
                else if (primaryRole === '부감독') newWorkers.assistant.push(name)
                else newWorkers.video.push(name)
            }
        })
    }

    console.log('Corrected Workers:', JSON.stringify(newWorkers, null, 2))

    // 4. Update the worklog
    const { error: updateError } = await supabase
        .from('worklogs')
        .update({ workers: newWorkers })
        .eq('id', log.id)

    if (updateError) {
        console.error('Error updating worklog:', updateError)
    } else {
        console.log('Successfully updated worklog workers!')
    }
}

fixWorklogWorkers()
