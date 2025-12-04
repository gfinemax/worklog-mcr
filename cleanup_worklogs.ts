
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function cleanup() {
    console.log('Starting cleanup...')

    // 1. Get Groups
    const { data: groups } = await supabase.from('groups').select('id, name')
    const getGroupId = (name: string) => groups?.find(g => g.name === name)?.id

    // 2. Fix 11-29 Duplicate (Night)
    // Expected: 2조. Found: 2조 (Correct) and 1조 (Incorrect with posts).
    console.log('Fixing 11-29 duplicates...')
    const { data: logs1129 } = await supabase
        .from('worklogs')
        .select('id, group_name')
        .eq('date', '2025-11-29')
        .eq('type', '야간')

    const correctLog = logs1129?.find(l => l.group_name === '2조')
    const incorrectLog = logs1129?.find(l => l.group_name === '1조') // Assuming 1조 is the duplicate based on previous analysis

    if (correctLog && incorrectLog) {
        console.log(`Moving posts from ${incorrectLog.id} (1조) to ${correctLog.id} (2조)...`)

        // Move posts
        const { error: moveError } = await supabase
            .from('posts')
            .update({ worklog_id: correctLog.id })
            .eq('worklog_id', incorrectLog.id)

        if (moveError) console.error('Error moving posts:', moveError)
        else {
            // Delete incorrect log
            const { error: delError } = await supabase
                .from('worklogs')
                .delete()
                .eq('id', incorrectLog.id)

            if (delError) console.error('Error deleting incorrect log:', delError)
            else console.log('Duplicate fixed.')
        }
    } else {
        console.log('Duplicate logs for 11-29 not found as expected. Skipping.')
    }

    // 3. Create Missing Logs
    const missingToCreate = [
        { date: '2025-12-04', type: '야간', group: '2조' },
        { date: '2025-12-02', type: '주간', group: '1조' },
        { date: '2025-12-01', type: '야간', group: '4조' },
        { date: '2025-11-30', type: '주간', group: '4조' }
    ]

    for (const item of missingToCreate) {
        const groupId = getGroupId(item.group)
        if (!groupId) {
            console.error(`Group ID not found for ${item.group}`)
            continue
        }

        // Check if already exists (just in case)
        const { data: existing } = await supabase
            .from('worklogs')
            .select('id')
            .eq('date', item.date)
            .eq('type', item.type)
            .eq('group_name', item.group) // Check specific group
            .maybeSingle()

        if (!existing) {
            console.log(`Creating missing log: ${item.date} ${item.type} ${item.group}...`)
            const { error } = await supabase.from('worklogs').insert({
                date: item.date,
                type: item.type,
                group_name: item.group,
                group_id: groupId,
                status: '작성중',
                workers: { director: [], assistant: [], video: [] },
                is_auto_created: true
            })
            if (error) console.error('Error creating log:', error)
            else console.log('Created.')
        } else {
            console.log(`Log for ${item.date} ${item.type} already exists.`)
        }
    }

    console.log('Cleanup complete.')
}

cleanup()
