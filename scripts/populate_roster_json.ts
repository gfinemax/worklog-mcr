
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function populateRosterJson() {
    console.log('Starting roster_json population...')

    // 1. Fetch current group members
    const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
            group:groups(name),
            user_id
        `)

    if (membersError) {
        console.error('Error fetching members:', membersError)
        return
    }

    if (!members) {
        console.log('No members found')
        return
    }

    // 2. Build roster object
    const roster: Record<string, string[]> = {}
    members.forEach((m: any) => {
        const groupName = m.group.name
        if (!roster[groupName]) {
            roster[groupName] = []
        }
        roster[groupName].push(m.user_id)
    })

    console.log('Constructed Roster:', roster)

    // 3. Update the active configuration using upsert
    const configId = '1d52aea4-f283-4cd1-8d59-408f0d29316b'
    console.log(`Fetching full config ${configId}...`)

    const { data: config, error: fetchError } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .eq('id', configId)
        .single()

    if (fetchError || !config) {
        console.error('Error fetching target config:', fetchError)
        return
    }

    console.log('Upserting config with roster_json...')

    const updatedConfig = {
        ...config,
        roster_json: roster
    }

    const { error: updateError } = await supabase
        .from('shift_pattern_configs')
        .upsert(updatedConfig)

    if (updateError) {
        console.error('Error updating config:', updateError)
    } else {
        console.log('Successfully updated roster_json!')
    }
}

populateRosterJson()
