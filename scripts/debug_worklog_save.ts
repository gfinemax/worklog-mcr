
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugWorklogSave() {
    console.log('Starting debug process for worklog save...')

    const teamName = '1조'
    const date = '2025-11-30' // Test date

    // 1. Get Group ID
    const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('name', teamName)
        .single()

    if (groupError || !groupData) {
        console.error('Error finding group:', groupError)
        return
    }

    console.log(`Group ID for ${teamName}:`, groupData.id)

    // 2. Try Upsert
    const payload = {
        date: date,
        type: '주간',
        status: '작성중',
        workers: { director: [], assistant: [], video: [] },
        group_id: groupData.id, // This is the suspect column
        team: teamName // Adding team as it is in the schema I saw
    }

    console.log('Attempting upsert with payload:', JSON.stringify(payload, null, 2))

    const { data, error } = await supabase
        .from('worklogs')
        .upsert(payload, {
            onConflict: 'group_id, date, type', // This constraint might also be missing
            ignoreDuplicates: false
        })
        .select()

    if (error) {
        console.error('Error adding/updating worklog:', JSON.stringify(error, null, 2))
    } else {
        console.log('Successfully saved worklog:', JSON.stringify(data, null, 2))
    }
}

debugWorklogSave()
