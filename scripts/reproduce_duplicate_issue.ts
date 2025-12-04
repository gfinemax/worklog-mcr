
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS if needed

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function reproduceIssue() {
    console.log('Starting reproduction of duplicate worklog issue...')

    const testDate = '2099-01-01' // Future date to avoid conflicts
    const teamName = '1조'
    const shiftType = '주간'

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

    // 2. Simulate Cron Job Creation (Missing group_id)
    console.log('Simulating Cron Job creation (without group_id)...')
    const { data: cronLog, error: createError } = await supabase
        .from('worklogs')
        .insert({
            date: testDate,
            type: shiftType,
            team: teamName,
            status: '작성중',
            workers: { director: [], assistant: [], video: [] },
            is_auto_created: true,
            // group_id is OMITTED
        })
        .select()
        .single()

    if (createError) {
        console.error('Error creating cron log:', createError)
        return
    }

    console.log('Cron log created with ID:', cronLog.id)
    console.log('Cron log group_id:', cronLog.group_id) // Should be null

    // 3. Simulate Store Check (Using group_id)
    console.log('Simulating Store check (using group_id)...')
    const { data: storeLog, error: fetchError } = await supabase
        .from('worklogs')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('date', testDate)
        .eq('type', shiftType)
        .maybeSingle()

    if (fetchError) {
        console.error('Error fetching store log:', fetchError)
    }

    if (storeLog) {
        console.log('Store FOUND the log (Unexpected if bug exists). ID:', storeLog.id)
    } else {
        console.log('Store DID NOT find the log (Bug Reproduced!).')
    }

    // 4. Cleanup
    console.log('Cleaning up...')
    await supabase.from('worklogs').delete().eq('id', cronLog.id)
}

reproduceIssue()
