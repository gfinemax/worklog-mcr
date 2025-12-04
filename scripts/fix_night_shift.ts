
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixNightShift() {
    const date = '2025-12-04'

    // 1. Check for 2조 Night
    const { data: correctLog } = await supabase
        .from('worklogs')
        .select('id')
        .eq('date', date)
        .eq('type', '야간')
        .eq('group_name', '2조') // Check by name just in case
        .maybeSingle()

    // 2. Check for 3조 Night (Incorrect)
    const { data: incorrectLog } = await supabase
        .from('worklogs')
        .select('id')
        .eq('date', date)
        .eq('type', '야간')
        .eq('group_name', '3조')
        .maybeSingle()

    if (correctLog) {
        console.log('Correct log (2조 Night) already exists:', correctLog.id)
        if (incorrectLog) {
            console.log('Deleting incorrect log (3조 Night):', incorrectLog.id)
            await supabase.from('worklogs').delete().eq('id', incorrectLog.id)
        }
    } else {
        if (incorrectLog) {
            console.log('Updating incorrect log (3조 Night) to 2조 Night:', incorrectLog.id)

            // Get 2조 Group ID
            const { data: groupData } = await supabase
                .from('groups')
                .select('id')
                .eq('name', '2조')
                .single()

            if (!groupData) {
                console.error('Group 2조 not found')
                return
            }

            const { error: updateError } = await supabase
                .from('worklogs')
                .update({
                    group_name: '2조',
                    group_id: groupData.id,
                    workers: { director: [], assistant: [], video: [] } // Reset workers so they can be re-fetched
                })
                .eq('id', incorrectLog.id)

            if (updateError) {
                console.error('Update failed:', updateError)
            } else {
                console.log('Update successful.')
            }
        } else {
            console.log('No Night logs found for 2025-12-04??')
        }
    }
}

fixNightShift()
