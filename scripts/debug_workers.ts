
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

async function debugWorkers() {
    console.log('--- Debugging Workers Data ---')

    // 1. Fetch the most recent worklog
    const { data: worklogs, error: worklogError } = await supabase
        .from('worklogs')
        .select('*') // Select all to see actual column names
        .order('created_at', { ascending: false })
        .limit(1)

    if (worklogError) {
        console.error('Error fetching worklog:', worklogError)
    } else if (worklogs && worklogs.length > 0) {
        const log = worklogs[0]
        console.log('\n[Most Recent Worklog]')
        console.log(`ID: ${log.id}`)
        console.log(`Date: ${log.date}`)
        // Check for team or group_name
        console.log(`Team/Group: ${log.team || log.group_name}`)
        console.log(`Type: ${log.type}`)
        console.log('Workers JSON:', JSON.stringify(log.workers, null, 2))
    } else {
        console.log('\nNo worklogs found.')
    }

    // 1.5 Fetch Shift Pattern Config for today
    const today = new Date().toISOString().split('T')[0]
    const { data: configs, error: configError } = await supabase
        .from('shift_pattern_configs')
        .select('id, valid_from, roster_json')
        .lte('valid_from', today)
        .order('valid_from', { ascending: false })
        .limit(1)

    if (configError) {
        console.error('Error fetching config:', configError)
    } else if (configs && configs.length > 0) {
        const config = configs[0]
        console.log('\n[Current Shift Pattern Config]')
        console.log(`ID: ${config.id}`)
        console.log(`Valid From: ${config.valid_from}`)
        console.log('Roster JSON Keys:', Object.keys(config.roster_json || {}))

        // Print roster for '1조' if exists
        if (config.roster_json && config.roster_json['1조']) {
            console.log('Roster for 1조:', config.roster_json['1조'])
        }
        // Print roster for 'A조' if exists
        if (config.roster_json && config.roster_json['A조']) {
            console.log('Roster for A조:', config.roster_json['A조'])
        }
    } else {
        console.log('\nNo active shift pattern config found.')
    }

    // 2. Fetch group members
    const { data: groups } = await supabase.from('groups').select('id, name')

    if (groups) {
        for (const group of groups) {
            console.log(`\n[Group Members: ${group.name}]`)
            const { data: members, error: memberError } = await supabase
                .from('group_members')
                .select(`
                display_order,
                user:users(name, role)
            `)
                .eq('group_id', group.id)
                .order('display_order')

            if (memberError) {
                console.error(`Error fetching members for ${group.name}:`, memberError)
            } else if (members) {
                members.forEach((m: any) => {
                    const role = m.user?.role || 'No Role'
                    const name = m.user?.name || 'Unknown'
                    console.log(`- ${name} (${role})`)
                })
            }
        }
    }
}

debugWorkers()
