
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSave() {
    try {
        console.log('Starting debug save...')

        // 1. Get group ID
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('id')
            .eq('name', '1조')
            .single()

        if (groupError) {
            console.error('Group Fetch Error:', groupError)
            return
        }
        console.log('Group ID:', groupData.id)

        // 2. Insert
        const payload = {
            date: '2025-11-29',
            team: '1조',
            type: '주간',
            status: '작성중',
            workers: {
                director: ['Test Director'],
                assistant: ['Test Assistant'],
                video: ['Test Video']
            },
            channel_logs: {},
            bad_column: 'test',
            group_id: groupData.id
        }

        const { data, error } = await supabase
            .from('worklogs')
            .insert(payload)
            .select()

        if (error) {
            console.error('INSERT ERROR:', JSON.stringify(error, null, 2))
        } else {
            console.log('INSERT SUCCESS:', data)
            // Cleanup
            await supabase.from('worklogs').delete().eq('id', data[0].id)
        }

    } catch (e) {
        console.error('EXCEPTION:', e)
    }
}

debugSave()
