
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyFix() {
    console.log('Starting verification of fix...')

    const testDate = '2099-01-02' // Different future date
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

    // 2. Simulate FIXED Cron Job Creation (WITH group_id)
    console.log('Simulating FIXED Cron Job creation (WITH group_id)...')
    const { data: cronLog, error: createError } = await supabase
        .from('worklogs')
        .insert({
            date: testDate,
            type: shiftType,
            group_name: teamName, // Use group_name
            status: '작성중',
            workers: { director: [], assistant: [], video: [] }, // Empty workers
            is_auto_created: true,
            group_id: groupData.id // <--- THE FIX
        })
        .select()
        .single()

    if (createError) {
        console.error('Error creating cron log:', createError)
        return
    }

    console.log('Cron log created with ID:', cronLog.id)

    // 3. Simulate Store Check & Update (Client Side)
    console.log('Simulating Store check (using group_id)...')
    const { data: existingLog, error: fetchError } = await supabase
        .from('worklogs')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('date', testDate)
        .eq('type', shiftType)
        .maybeSingle()

    if (fetchError) {
        console.error('Error fetching store log:', fetchError)
        return
    }

    if (existingLog) {
        console.log('Store FOUND the log (SUCCESS). ID:', existingLog.id)

        // Simulate Update with Workers
        console.log('Simulating Store UPDATE with workers...')
        const newWorkers = {
            director: ['Director Kim'],
            assistant: ['Assistant Lee'],
            video: []
        }

        const { data: updatedLog, error: updateError } = await supabase
            .from('worklogs')
            .update({ workers: newWorkers })
            .eq('id', existingLog.id)
            .select()
            .single()

        if (updateError) {
            console.error('Error updating log:', updateError)
        } else {
            console.log('Log updated successfully.')
            console.log('Updated Workers:', JSON.stringify(updatedLog.workers))

            if (updatedLog.workers.director[0] === 'Director Kim') {
                console.log('VERIFICATION PASSED: Log found and workers updated.')
            } else {
                console.log('VERIFICATION FAILED: Workers not updated correctly.')
            }
        }

    } else {
        console.log('Store DID NOT find the log (VERIFICATION FAILED).')
    }

    // 4. Cleanup
    console.log('Cleaning up...')
    await supabase.from('worklogs').delete().eq('id', cronLog.id)
}

verifyFix()
