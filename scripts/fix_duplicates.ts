
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicates() {
    const targetDate = '2025-12-06'
    const correctTeam = '5조'
    const incorrectTeam = '2조'
    const shiftType = '주간'

    console.log(`Checking duplicates for ${targetDate} (${shiftType})...`)

    // 1. Verify the incorrect log exists
    const { data: incorrectLog, error: fetchError } = await supabase
        .from('worklogs')
        .select('id, group_name, type, date')
        .eq('date', targetDate)
        .eq('type', shiftType)
        .eq('group_name', incorrectTeam)
        .single()

    if (fetchError || !incorrectLog) {
        console.log('Incorrect log not found or already deleted.')
    } else {
        console.log(`Found incorrect log: ${incorrectLog.id} (Team: ${incorrectLog.group_name})`)

        // 2. Delete it
        const { error: deleteError } = await supabase
            .from('worklogs')
            .delete()
            .eq('id', incorrectLog.id)

        if (deleteError) {
            console.error('Error deleting log:', deleteError)
        } else {
            console.log('Successfully deleted incorrect log.')
        }
    }

    // 3. Verify the correct log remains
    const { data: correctLog, error: verifyError } = await supabase
        .from('worklogs')
        .select('id, group_name, type, date')
        .eq('date', targetDate)
        .eq('type', shiftType)
        .eq('group_name', correctTeam)
        .single()

    if (correctLog) {
        console.log(`Verified correct log exists: ${correctLog.id} (Team: ${correctLog.group_name})`)
    } else {
        console.error('WARNING: Correct log not found!', verifyError)
    }
}

fixDuplicates()
