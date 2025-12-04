
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixWorklogData() {
    console.log('Fixing worklog data for 2025-12-03 1조 Night...')

    // Target Worklog ID from previous inspection
    const worklogId = '5ef48c88-d168-4523-a71d-7a397570fa3a'

    // Correct Workers for 1조 (Team 1)
    // Director: 김준일, Assistant: 박상필, Video: 김소연
    const correctWorkers = {
        director: ['김준일'],
        assistant: ['박상필'],
        video: ['김소연']
    }

    console.log(`Updating worklog ${worklogId} with correct workers:`, correctWorkers)

    const { error } = await supabase
        .from('worklogs')
        .update({ workers: correctWorkers })
        .eq('id', worklogId)

    if (error) {
        console.error('Error updating worklog:', error)
    } else {
        console.log('Successfully updated worklog workers!')
    }
}

fixWorklogData()
