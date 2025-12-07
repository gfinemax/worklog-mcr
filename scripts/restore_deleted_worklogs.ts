
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { format } from 'date-fns'

const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
const env: any = {}
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Audit Logs show 5조 handovers were cancelled multiple times on Dec 7 (in UTC 02:xx which is roughly 11AM KST).
 * This implies they were trying to handover to 5조 Day Shift (or Night Shift?).
 * 7th 02:26 UTC is 11:26 KST.
 * If they are doing Handover at 11:26 AM, they are likely Day shift? No wait.
 * 07:00 - 19:00 is Day.
 * Handover at 11am is strange unless it's a test.
 * 
 * Wait, audit logs say: timestamp: "2025-12-07T02:51:38.870Z" -> 11:51 AM KST.
 * Handover cancel target: 5조.
 * This implies they were trying to create a 5조 session.
 * 
 * If the user was logged in as someone else and trying to handover TO 5조.
 * 
 * We will assume we need to restore 5조 worklogs for Dec 7th.
 * Shift Type: Probably 'Day' (주간) if it was near noon.
 * 
 * Let's try to restore both Day and Night for 5조 for Dec 7th just in case,
 * checking if they exist first.
 */

async function restore() {
    const targetDate = '2025-12-07'
    const groupName = '5조'
    const shifts = ['주간', '야간']

    console.log(`Attempting to restore ${groupName} worklogs for ${targetDate}...`)

    for (const type of shifts) {
        // Check exist
        const { data: existing } = await supabase
            .from('worklogs')
            .select('*')
            .eq('date', targetDate)
            .eq('group_name', groupName)
            .eq('type', type)
            .maybeSingle()

        if (existing) {
            console.log(`[SKIP] Worklog for ${targetDate} ${groupName} ${type} already exists.`)
            continue
        }

        console.log(`[RESTORE] Creating empty worklog for ${targetDate} ${groupName} ${type}...`)

        // We need workers. Fetch from group members
        // First get group ID
        const { data: group } = await supabase.from('groups').select('id').eq('name', groupName).single()
        if (!group) {
            console.error("Group not found")
            continue
        }

        const { data: members } = await supabase
            .from('group_members')
            .select('user:users(name, role)')
            .eq('group_id', group.id)
            .order('display_order')

        const workers = {
            director: [] as string[],
            assistant: [] as string[],
            video: [] as string[]
        }

        if (members) {
            members.forEach((m: any) => {
                if (m.user) {
                    const role = (m.user.role || '').split(',')[0].trim()
                    if (role === '감독') workers.director.push(m.user.name)
                    else if (role === '부감독') workers.assistant.push(m.user.name)
                    else workers.video.push(m.user.name)
                }
            })
        }

        const { error } = await supabase.from('worklogs').insert({
            date: targetDate,
            group_name: groupName,
            type: type,
            workers: workers,
            status: '작성중',
            signature: '1/4',
            channel_logs: {},
            system_issues: []
        })

        if (error) {
            console.error(`Failed to create: ${error.message}`)
        } else {
            console.log("Success.")
        }
    }
}

restore()
