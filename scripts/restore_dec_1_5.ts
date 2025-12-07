
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { addDays, differenceInDays, parseISO, format } from 'date-fns'

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

async function restoreRange() {
    const startDateStr = '2025-12-01'
    const endDateStr = '2025-12-05'

    console.log(`Restoring logs from ${startDateStr} to ${endDateStr}...`)

    // 1. Fetch Config
    // We assume the config valid for startDate is valid for endDate (5 days range usually safe)
    // Or we fetch per day. Let's fetch the one active at startDate.
    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', startDateStr)
        .or(`valid_to.is.null,valid_to.gte.${startDateStr}`)
        .order('valid_from', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error("Could not find shift config for", startDateStr, error)
        return
    }

    console.log(`Using Config ID: ${config.id}, Valid From: ${config.valid_from}`)

    // 2. Iterate Dates
    let cursor = parseISO(startDateStr)
    const end = parseISO(endDateStr)

    while (cursor <= end) {
        const dateStr = format(cursor, 'yyyy-MM-dd')

        // Calculate Teams
        const anchorDate = parseISO(config.valid_from)
        const diff = differenceInDays(cursor, anchorDate)
        let index = diff % config.cycle_length
        if (index < 0) index += config.cycle_length

        const dailyPattern = config.pattern_json.find((p: any) => p.day === index)

        if (!dailyPattern) {
            console.error(`No pattern found for day index ${index}`)
            cursor = addDays(cursor, 1)
            continue
        }

        const dayTeam = dailyPattern.A.team
        const daySwap = dailyPattern.A.is_swap
        const nightTeam = dailyPattern.N.team
        const nightSwap = dailyPattern.N.is_swap

        console.log(`[${dateStr}] Expected: Day=${dayTeam} (Swap:${daySwap}), Night=${nightTeam} (Swap:${nightSwap})`)

        // Restore Day
        await restoreLog(dateStr, '주간', dayTeam, daySwap)
        // Restore Night
        await restoreLog(dateStr, '야간', nightTeam, nightSwap)

        cursor = addDays(cursor, 1)
    }
}

async function restoreLog(dateStr: string, type: '주간' | '야간', groupName: string, isSwap: boolean) {
    // Check if exists
    const { data: existing } = await supabase
        .from('worklogs')
        .select('id')
        .eq('date', dateStr)
        .eq('group_name', groupName)
        .eq('type', type)
        .maybeSingle()

    if (existing) {
        console.log(`  - Log exists: ${groupName} ${type}`)
        return
    }

    console.log(`  - MISSING: Restoring ${groupName} ${type}...`)

    // Fetch Workers
    const { data: group } = await supabase.from('groups').select('id').eq('name', groupName).single()
    if (!group) {
        console.error(`    Group ${groupName} not found!`)
        return
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

    // Role logic: Normal (Dir=0, Asst=1), Swap (Dir=1, Asst=0)
    // Actually we need to filter just the 2 DA members first?
    // Logic from worklog-detail:
    if (members) {
        const daMembers: any[] = []
        members.forEach((m: any) => {
            if (m.user) {
                const role = (m.user.role || '').split(',')[0].trim()
                if (role === '영상') {
                    workers.video.push(m.user.name)
                } else {
                    daMembers.push(m.user) // Director/Assistant candidates
                }
            }
        })

        if (daMembers.length > 0) {
            // isSwap affects who is Director vs Assistant
            // Normal: 0->Director, 1->Assistant
            // Swap: 0->Assistant, 1->Director

            // Wait, usually the members are ORDERED by display_order.
            // Assuming display_order is [Director, Assistant, ...]

            const idxDir = isSwap ? 1 : 0
            const idxAsst = isSwap ? 0 : 1

            if (daMembers[idxDir]) workers.director.push(daMembers[idxDir].name)
            if (daMembers[idxAsst]) workers.assistant.push(daMembers[idxAsst].name)

            // Extras to Assistant?
            for (let i = 2; i < daMembers.length; i++) {
                workers.assistant.push(daMembers[i].name)
            }
        }
    }

    const { error } = await supabase.from('worklogs').insert({
        date: dateStr,
        group_name: groupName,
        type: type,
        workers: workers,
        status: '작성중',
        signature: '1/4',
        channel_logs: {},
        system_issues: []
    })

    if (error) {
        console.error(`    Failed to insert: ${error.message}`)
    } else {
        console.log(`    Successfully restored.`)
    }
}

restoreRange()
